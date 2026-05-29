import { availabilityToDisplaySlots } from '@/lib/bookingSlots';
import type { AvailabilityResult } from '@/types/booking';

describe('availabilityToDisplaySlots', () => {
  const base: AvailabilityResult = {
    date: '2026-05-22',
    dayName: 'Friday',
    service: { id: 's', name: 'Cut', durationMinutes: 60, price: 50 },
    slots: [
      { time: '10:00', staff: [{ id: 'st1', name: 'A', avatarUrl: null, price: 50 }] },
      { time: '11:00', staff: [{ id: 'st2', name: 'B', avatarUrl: null, price: 50 }] },
    ],
    reserved_slots: ['11:00'],
    isAvailable: true,
  };

  it('marks open slots as available', () => {
    const out = availabilityToDisplaySlots(base, null);
    const ten = out.find((s) => s.time === '10:00');
    expect(ten?.available).toBe(true);
    expect(ten?.reservable).toBe(false);
  });

  it('marks reserved-only times as reservable', () => {
    const onlyReserved: AvailabilityResult = {
      ...base,
      slots: [{ time: '10:00', staff: [{ id: 'st1', name: 'A', avatarUrl: null, price: 50 }] }],
      reserved_slots: ['11:00'],
    };
    const out = availabilityToDisplaySlots(onlyReserved, null);
    const eleven = out.find((s) => s.time === '11:00');
    expect(eleven?.available).toBe(false);
    expect(eleven?.reservable).toBe(true);
  });

  it('filters by staff id', () => {
    const out = availabilityToDisplaySlots(base, 'st1');
    expect(out.find((s) => s.time === '10:00')?.available).toBe(true);
    expect(out.find((s) => s.time === '11:00')?.available).toBe(false);
  });
});
