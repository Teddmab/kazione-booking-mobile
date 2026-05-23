import type { AppointmentWithRelations } from "@/types/owner";

export const CALENDAR_HOUR_START = 8;
export const CALENDAR_HOUR_END = 20;
export const CALENDAR_HOUR_HEIGHT = 52;

/** Monday 00:00 local. */
export function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfWeekSunday(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function shiftWeek(weekStart: Date, deltaWeeks: number): Date {
  const next = new Date(weekStart);
  next.setDate(next.getDate() + deltaWeeks * 7);
  return next;
}

export function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = endOfWeekSunday(weekStart);
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
  const endFmt = weekEnd.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: weekStart.getFullYear() !== weekEnd.getFullYear() ? "numeric" : undefined,
  });
  return `${fmt(weekStart)} — ${endFmt}`;
}

export function weekDayLabels(weekStart: Date): { index: number; label: string; iso: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return {
      index: i,
      label: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      iso: toIsoDateLocal(d),
    };
  });
}

export function groupAppointmentsByWeekDay(
  appointments: AppointmentWithRelations[],
  weekStart: Date,
): Map<number, AppointmentWithRelations[]> {
  const map = new Map<number, AppointmentWithRelations[]>();
  for (let i = 0; i < 7; i++) map.set(i, []);

  const startMs = weekStart.getTime();
  for (const appt of appointments) {
    const d = new Date(appt.starts_at);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayIndex = Math.round((dayStart.getTime() - startMs) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < 7) {
      map.get(dayIndex)!.push(appt);
    }
  }
  return map;
}

/** Minutes from CALENDAR_HOUR_START for vertical placement. */
export function minutesFromCalendarStart(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes() - CALENDAR_HOUR_START * 60;
}

export function blockHeightPx(durationMinutes: number): number {
  return Math.max(28, (durationMinutes / 60) * CALENDAR_HOUR_HEIGHT);
}

export function blockTopPx(iso: string): number {
  const mins = minutesFromCalendarStart(iso);
  return (mins / 60) * CALENDAR_HOUR_HEIGHT;
}

export function isTodayInWeek(weekStart: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = endOfWeekSunday(weekStart);
  end.setHours(0, 0, 0, 0);
  return today >= weekStart && today <= end;
}

export function currentTimeLineTopPx(): number | null {
  const now = new Date();
  const h = now.getHours();
  if (h < CALENDAR_HOUR_START || h >= CALENDAR_HOUR_END) return null;
  return blockTopPx(now.toISOString());
}

export const APPOINTMENT_BLOCK_COLORS: Record<string, { bg: string; border: string }> = {
  pending: { bg: "#fff8e1", border: "#f9a825" },
  pending_payment: { bg: "#fff3e0", border: "#fb8c00" },
  confirmed: { bg: "#e8f5e9", border: "#43a047" },
  in_progress: { bg: "#e3f2fd", border: "#1e88e5" },
  completed: { bg: "#f5f5f5", border: "#9e9e9e" },
  cancelled: { bg: "#ffebee", border: "#e53935" },
  no_show: { bg: "#fce4ec", border: "#ad1457" },
};
