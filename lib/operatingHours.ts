import type { DayHours } from "@/types/owner";

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DEFAULT_OPERATING_HOURS: Record<string, DayHours> = {
  Monday: { open: true, start: "09:00", end: "19:00" },
  Tuesday: { open: true, start: "09:00", end: "19:00" },
  Wednesday: { open: true, start: "09:00", end: "19:00" },
  Thursday: { open: true, start: "09:00", end: "19:00" },
  Friday: { open: true, start: "09:00", end: "19:00" },
  Saturday: { open: true, start: "09:00", end: "17:00" },
  Sunday: { open: false, start: "09:00", end: "17:00" },
};

export function mergeOperatingHours(
  saved: Record<string, DayHours> | null | undefined,
): Record<string, DayHours> {
  return { ...DEFAULT_OPERATING_HOURS, ...(saved ?? {}) };
}
