import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { useAuthContext } from "@/contexts/AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type OwnerNotification,
} from "@/services/owner/notifications";
import { getSupabase } from "@/lib/supabase";

export type StaffNotification = OwnerNotification;

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

export function useStaffNotifications(enabled = true) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const query = useQuery({
    queryKey: ["staff-notifications", userId],
    queryFn: () => getNotifications(),
    enabled: enabled && !!userId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!enabled || !userId) return;

    const supabase = getSupabase();
    const topicSuffix = `staff-notifications:${userId}`;
    removeStaleChannel(supabase, topicSuffix);

    const channel: RealtimeChannel = supabase
      .channel(topicSuffix)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["staff-notifications", userId],
          });
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId, queryClient]);

  return query;
}

export function useStaffUnreadNotificationCount() {
  const { data } = useStaffNotifications();
  return (data ?? []).filter((n) => !n.is_read).length;
}

export function useMarkStaffNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["staff-notifications"] });
    },
  });
}

export function useMarkAllStaffNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["staff-notifications"] });
    },
  });
}
