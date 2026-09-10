/** Business-timezone helpers — parity with web `appointmentFormat` / S59 real UTC. */

export function zonedParts(
  iso: string,
  timeZone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dateKey: string;
} {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const hour = Number(map.hour);
  const minute = Number(map.minute);
  return {
    year,
    month,
    day,
    hour,
    minute,
    dateKey: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

/** Minutes from midnight in the business timezone. */
export function zonedWallMinutes(iso: string, timeZone: string): number {
  const p = zonedParts(iso, timeZone);
  return p.hour * 60 + p.minute;
}

/** YYYY-MM-DD of an instant in the business timezone. */
export function zonedDateKey(iso: string, timeZone: string): string {
  return zonedParts(iso, timeZone).dateKey;
}
