import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabase";

function removeStaleChannel(supabase: ReturnType<typeof getSupabase>, topicSuffix: string) {
  for (const ch of supabase.getChannels()) {
    if (ch.topic.includes(topicSuffix)) {
      ch.unsubscribe();
      void supabase.removeChannel(ch);
    }
  }
}

function usePostgresRealtime(
  enabled: boolean,
  channelKey: string,
  table: string,
  businessId: string,
  onChange: () => void,
) {
  const queryClient = useQueryClient();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled || !businessId) return;

    const supabase = getSupabase();
    const topicSuffix = `${channelKey}:${businessId}`;
    removeStaleChannel(supabase, topicSuffix);

    const channel: RealtimeChannel = supabase
      .channel(topicSuffix)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          onChangeRef.current();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [enabled, businessId, channelKey, table, queryClient]);
}

/** Invalidates owner appointment + client queries on DB changes (parity with web). */
export function useOwnerAppointmentsRealtime(businessId: string) {
  const queryClient = useQueryClient();

  usePostgresRealtime(!!businessId, "owner-appointments", "appointments", businessId, () => {
    void queryClient.invalidateQueries({ queryKey: ["owner-appointments", businessId] });
    void queryClient.invalidateQueries({ queryKey: ["owner-dashboard-kpis", businessId] });
  });
}

export function useOwnerClientsRealtime(businessId: string) {
  const queryClient = useQueryClient();

  usePostgresRealtime(!!businessId, "owner-clients", "clients", businessId, () => {
    void queryClient.invalidateQueries({ queryKey: ["owner-clients", businessId] });
    void queryClient.invalidateQueries({ queryKey: ["owner-client-stats", businessId] });
  });
}
