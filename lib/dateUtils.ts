/** YYYY-MM-DD in local calendar (same convention as web booking). */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today at midnight for comparisons. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Next `count` days from `start` (inclusive), each at midnight. */
export function nextCalendarDays(start: Date, count: number): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

export function formatShortWeekday(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export function formatDayMonth(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
