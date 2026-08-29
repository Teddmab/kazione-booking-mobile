export type StaffPushData = {
  type?: string;
  appointment_id?: string;
  notification_id?: string;
};

export function parseStaffPushData(
  data: Record<string, unknown> | undefined,
): StaffPushData {
  if (!data) return {};
  const str = (key: string) => {
    const v = data[key];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };
  return {
    type: str("type"),
    appointment_id: str("appointment_id"),
    notification_id: str("notification_id"),
  };
}

/** Staff deep-link target from Expo push `data`. */
export function staffHrefForPushData(data: StaffPushData): string {
  const type = (data.type ?? "").toLowerCase();
  if (
    type.includes("service") ||
    type === "service_offer" ||
    type.startsWith("service_")
  ) {
    return "/(app)/staff/(tabs)/services";
  }
  if (
    data.appointment_id ||
    type.includes("appointment") ||
    type === "new_booking"
  ) {
    return "/(app)/staff/(tabs)/calendar";
  }
  return "/(app)/staff/(tabs)/notifications";
}
