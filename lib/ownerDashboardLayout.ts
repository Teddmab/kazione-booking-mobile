import type { AppointmentWithRelations, StaffMember, StaffWorkingDay } from "@/types/owner";

export type PerformancePreset = "thisWeek" | "thisMonth" | "last30d";

export interface DateRangeStr {
  from: string;
  to: string;
}

export interface CapacityDay {
  date: string;
  bookedMinutes: number;
  availableMinutes: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtUtcDateStr(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function asUtcMidnight(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function businessTodayStr(tz: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: tz });
}

export function businessLocalDateStr(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: tz });
}

export function businessDayOfWeek(dateStr: string): number {
  return asUtcMidnight(dateStr).getUTCDay();
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = asUtcMidnight(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return fmtUtcDateStr(d);
}

export function fmtBusinessDateLong(dateStr: string, locale = "en-GB"): string {
  return asUtcMidnight(dateStr).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function fmtBusinessTime(iso: string, tz: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

export function fmtDateRangeLabel(fromStr: string, toStr: string, locale = "en-GB"): string {
  const from = asUtcMidnight(fromStr);
  const to = asUtcMidnight(toStr);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  };
  if (fromStr === toStr) return from.toLocaleDateString(locale, opts);
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const sameMonth = sameYear && from.getUTCMonth() === to.getUTCMonth();
  if (sameMonth) {
    const day = from.toLocaleDateString(locale, { day: "numeric", timeZone: "UTC" });
    return `${day}–${to.toLocaleDateString(locale, opts)}`;
  }
  const fromOpts: Intl.DateTimeFormatOptions = sameYear
    ? { day: "numeric", month: "short", timeZone: "UTC" }
    : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  return `${from.toLocaleDateString(locale, fromOpts)} – ${to.toLocaleDateString(locale, opts)}`;
}

export function shortDayLabel(dateStr: string, locale: string): string {
  return asUtcMidnight(dateStr).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function computeBusinessPresetRange(preset: PerformancePreset, tz: string): DateRangeStr {
  const todayStr = businessTodayStr(tz);
  const today = asUtcMidnight(todayStr);
  if (preset === "thisWeek") {
    const dow = today.getUTCDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + diffToMonday);
    return { from: fmtUtcDateStr(monday), to: todayStr };
  }
  if (preset === "thisMonth") {
    const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    return { from: fmtUtcDateStr(first), to: todayStr };
  }
  const d = new Date(today);
  d.setUTCDate(today.getUTCDate() - 29);
  return { from: fmtUtcDateStr(d), to: todayStr };
}

export function computeFullWeekRange(dateStr: string): DateRangeStr {
  const dow = businessDayOfWeek(dateStr);
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = addDaysToDateStr(dateStr, diffToMonday);
  return { from: monday, to: addDaysToDateStr(monday, 6) };
}

export function todaysWorkingHours(
  workingHours: StaffWorkingDay[],
  dayOfWeek: number,
): { start: string | null; end: string | null } | null {
  const entry = workingHours.find((d) => d.day === dayOfWeek);
  if (!entry || !entry.is_working) return null;
  return { start: entry.start_time, end: entry.end_time };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function staffAvailableMinutesForDay(staff: StaffMember, dateStr: string): number {
  const hours = todaysWorkingHours(staff.working_hours ?? [], businessDayOfWeek(dateStr));
  if (!hours?.start || !hours.end) return 0;
  return Math.max(0, timeToMinutes(hours.end) - timeToMinutes(hours.start));
}

export function computeCapacityWeek(
  startDateStr: string,
  staffList: StaffMember[],
  appts: AppointmentWithRelations[],
  tz: string,
): CapacityDay[] {
  const days: CapacityDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDaysToDateStr(startDateStr, i);
    const availableMinutes = staffList.reduce(
      (sum, s) => sum + staffAvailableMinutesForDay(s, date),
      0,
    );
    const bookedMinutes = appts
      .filter(
        (a) =>
          businessLocalDateStr(a.starts_at, tz) === date &&
          a.status !== "cancelled" &&
          a.status !== "no_show",
      )
      .reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
    days.push({ date, bookedMinutes, availableMinutes });
  }
  return days;
}

export interface DashboardPeriodMetrics {
  earned: number;
  expected: number;
  completedCount: number;
  cancelledCount: number;
  cancelledRatePct: number;
  totalAppointments: number;
  avgTicket: number | null;
  topServices: { name: string; count: number }[];
}

export function computeDashboardPeriodMetrics(
  appts: AppointmentWithRelations[],
): DashboardPeriodMetrics {
  const completed = appts.filter((a) => a.status === "completed");
  const earned = completed.reduce((s, a) => s + (a.price ?? 0), 0);
  const expected = appts
    .filter((a) => a.status === "confirmed")
    .reduce((s, a) => s + (a.price ?? 0), 0);
  const cancelledCount = appts.filter(
    (a) => a.status === "cancelled" || a.status === "no_show",
  ).length;
  const totalAppointments = appts.length;
  const serviceMap = new Map<string, number>();
  for (const a of appts.filter((x) => x.status !== "cancelled" && x.status !== "no_show")) {
    const name = a.service?.name ?? "";
    if (!name) continue;
    serviceMap.set(name, (serviceMap.get(name) ?? 0) + 1);
  }
  const topServices = [...serviceMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));

  return {
    earned,
    expected,
    completedCount: completed.length,
    cancelledCount,
    cancelledRatePct:
      totalAppointments > 0 ? Math.round((cancelledCount / totalAppointments) * 100) : 0,
    totalAppointments,
    avgTicket: completed.length > 0 ? earned / completed.length : null,
    topServices,
  };
}
