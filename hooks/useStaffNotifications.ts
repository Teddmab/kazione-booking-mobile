import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type OwnerNotification,
} from "@/services/owner/notifications";

export type StaffNotification = OwnerNotification;

export function useStaffNotifications(enabled = true) {
  return useQuery({
    queryKey: ["staff-notifications"],
    queryFn: () => getNotifications(),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
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
