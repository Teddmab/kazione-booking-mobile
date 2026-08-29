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

/** Register Expo push token (requires backend MPUSH endpoints). */
export async function registerPushToken(
  token: string,
  platform: "ios" | "android",
): Promise<{ ok: boolean }> {
  return api.post("/notifications?action=register-push-token", {
    token,
    platform,
  });
}

/** Remove Expo push token for this device. */
export async function unregisterPushToken(
  token: string,
): Promise<{ ok: boolean }> {
  return api.post("/notifications?action=unregister-push-token", { token });
}
