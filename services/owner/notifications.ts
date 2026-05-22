import { api } from "@/lib/api";

export interface OwnerNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
  metadata?: { appointment_id?: string } | null;
}

export async function getNotifications(limit = 50): Promise<OwnerNotification[]> {
  return api.get<OwnerNotification[]>(`/notifications?limit=${limit}`);
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  return api.patch(`/notifications?id=${encodeURIComponent(id)}`, {});
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean; updated?: number }> {
  return api.post("/notifications?action=mark-all-read", {});
}
