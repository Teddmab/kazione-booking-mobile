import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** Icon for a staff/owner notification type (parity with web). */
export function getNotificationIcon(type: string | null | undefined): IconName {
  const t = (type ?? "").toLowerCase();
  if (t.startsWith("appointment_")) return "calendar-outline";
  if (t.startsWith("review_")) return "star-outline";
  if (t === "message") return "chatbubble-outline";
  return "notifications-outline";
}
