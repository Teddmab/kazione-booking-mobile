import type { AvailabilityResult } from '@/types/booking';

export interface DisplaySlot {
  time: string;
  available: boolean;
  reservable: boolean;
}

/**
 * Maps get-availability response to UI slot states for TimeSlotGrid.
 * - available: open slot for selected staff (or any staff if no preference)
 * - reservable: occupied but may be held with deposit (reserved_slots)
 */
export function availabilityToDisplaySlots(
  availability: AvailabilityResult | undefined,
  staffId: string | null,
): DisplaySlot[] {
  if (!availability) return [];

  const openTimes = new Set<string>();
  for (const slot of availability.slots) {
    const hasStaff =
      staffId === null
        ? slot.staff.length > 0
        : slot.staff.some((s) => s.id === staffId);
    if (hasStaff) openTimes.add(slot.time);
  }

  const reserved = new Set(availability.reserved_slots ?? []);
  const allTimes = new Set([...openTimes, ...reserved]);

  return [...allTimes].sort().map((time) => {
    const available = openTimes.has(time);
    const reservable = !available && reserved.has(time);
    return { time, available, reservable };
  });
}
