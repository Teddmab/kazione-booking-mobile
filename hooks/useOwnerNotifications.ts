import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { useAuthContext } from "@/contexts/AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/owner/notifications";
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

export function useOwnerNotifications(enabled = true) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const query = useQuery({
    queryKey: ["owner-notifications", userId],
    queryFn: () => getNotifications(),
    enabled: enabled && !!userId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!enabled || !userId) return;

    const supabase = getSupabase();
    const topicSuffix = `owner-notifications:${userId}`;
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
            queryKey: ["owner-notifications", userId],
          });
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId, queryClient]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const onChange = (state: AppStateStatus) => {
      if (state === "active") {
        void queryClient.invalidateQueries({
          queryKey: ["owner-notifications", userId],
        });
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [enabled, userId, queryClient]);

  return query;
}

export function useUnreadNotificationCount() {
  const { data } = useOwnerNotifications();
  return (data ?? []).filter((n) => !n.is_read).length;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-notifications"] });
    },
  });
}
