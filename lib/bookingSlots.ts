import type { AvailabilityResult } from "@/types/booking";

export interface DisplaySlot {
  time: string;
  available: boolean;
}

export function availabilityToDisplaySlots(
  availability: AvailabilityResult | undefined,
  staffId: string | null,
): DisplaySlot[] {
  if (!availability || !availability.isAvailable) return [];

  return availability.slots.map((slot) => {
    const reserved = availability.reserved_slots?.includes(slot.time) ?? false;
    const hasStaff = staffId
      ? slot.staff.some((s) => s.id === staffId)
      : slot.staff.length > 0;

    return { time: slot.time, available: !reserved && hasStaff };
  });
}
