/** Visual status used for badges / cards — independent of page navigation. */
export type AppointmentDisplayStatus =
  | "confirmed"
  | "in_progress"
  | "pending"
  | "offered"
  | "late"
  | "arrived"
  | "completed"
  | "pending_completion"
  | "cancelled"
  | "no_show"
  | "conflict"
  | "other";

/**
 * Resolves what to show for an appointment right now.
 * - DB status wins when explicit (in_progress, arrived, completed, …)
 * - “late” is derived when confirmed and start time has passed
 * Pure / independent of screen mount — pass a ticking `now` for live updates.
 */
export function resolveAppointmentDisplayStatus(
  appt: {
    status: string;
    starts_at: string;
    ends_at: string;
  },
  now: Date = new Date(),
  isConflict = false,
): AppointmentDisplayStatus {
  if (isConflict) return "conflict";

  const status = appt.status;
  if (status === "in_progress") return "in_progress";
  if (status === "arrived") return "arrived";
  if (status === "completed") return "completed";
  if (status === "pending_completion") return "pending_completion";
  if (status === "cancelled") return "cancelled";
  if (status === "no_show") return "no_show";
  if (status === "pending") return "pending";
  if (status === "offered") return "offered";

  if (status === "confirmed") {
    const start = new Date(appt.starts_at);
    const end = new Date(appt.ends_at);
    if (now >= start && now < end) return "in_progress";
    if (now >= end) return "late";
    if (now > start) return "late";
    return "confirmed";
  }

  return "other";
}

export function displayStatusI18nKey(status: AppointmentDisplayStatus): string {
  if (status === "late") return "staffCalendar.statusLate";
  if (status === "conflict") return "staffCalendar.statusConflict";
  return `staffStatus.${status}`;
}
