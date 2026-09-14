import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabase";

function removeStaleChannel(
  supabase: ReturnType<typeof getSupabase>,
  topicSuffix: string,
) {
  for (const ch of supabase.getChannels()) {
    if (ch.topic.includes(topicSuffix)) {
      ch.unsubscribe();
      void supabase.removeChannel(ch);
    }
  }
}

function invalidateStaffPortal(
  queryClient: ReturnType<typeof useQueryClient>,
  businessId: string,
) {
  void queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-offers"] });
  void queryClient.invalidateQueries({
    queryKey: ["staff-pending-completion"],
  });
  void queryClient.invalidateQueries({ queryKey: ["my-performance"] });
  void queryClient.invalidateQueries({
    queryKey: ["staff-services", businessId],
  });
}

/**
 * Live updates for staff Today / calendar / service offers — mount once in
 * the staff shell. Invalidates silently (no pull-to-refresh spinner).
 */
export function useStaffAppointmentsRealtime(
  businessId: string,
  staffProfileId = "",
) {
  const queryClient = useQueryClient();
  const businessIdRef = useRef(businessId);
  businessIdRef.current = businessId;

  useEffect(() => {
    if (!businessId) return;

    const supabase = getSupabase();
    const topicSuffix = `staff-portal:${businessId}`;
    removeStaleChannel(supabase, topicSuffix);

    const invalidate = () =>
      invalidateStaffPortal(queryClient, businessId);

    let channel: RealtimeChannel = supabase
      .channel(topicSuffix)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `business_id=eq.${businessId}`,
        },
        invalidate,
      );

    // Service offers land in staff_services (no business_id column).
    if (staffProfileId) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "staff_services",
          filter: `staff_profile_id=eq.${staffProfileId}`,
        },
        invalidate,
      );
    }

    channel.subscribe();

    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [businessId, staffProfileId, queryClient]);

  useEffect(() => {
    if (!businessId) return;

    const onChange = (state: AppStateStatus) => {
      if (state !== "active") return;
      invalidateStaffPortal(queryClient, businessId);
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [businessId, queryClient]);
}
