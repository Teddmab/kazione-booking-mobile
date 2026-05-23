import {
  groupAppointmentsByWeekDay,
  startOfWeekMonday,
  toIsoDateLocal,
} from "@/lib/ownerCalendar";
import type { AppointmentWithRelations } from "@/types/owner";

function fakeAppt(startsAt: string): AppointmentWithRelations {
  return {
    id: "a1",
    business_id: "b1",
    client_id: "c1",
    staff_profile_id: null,
    service_id: "s1",
    status: "confirmed",
    starts_at: startsAt,
    ends_at: startsAt,
    duration_minutes: 60,
    price: 50,
    deposit_amount: 0,
    booking_reference: "KAZ-1",
    client: {
      id: "c1",
      first_name: "A",
      last_name: "B",
      email: null,
      phone: null,
    },
    service: { id: "s1", name: "Cut", duration_minutes: 60, price: 50 },
    staff: null,
    payment: null,
  };
}

describe("ownerCalendar", () => {
  it("startOfWeekMonday lands on Monday", () => {
    const wed = new Date(2026, 4, 20);
    const mon = startOfWeekMonday(wed);
    expect(mon.getDay()).toBe(1);
  });

  it("groups appointments into week day index", () => {
    const weekStart = startOfWeekMonday(new Date(2026, 4, 19));
    const monIso = `${toIsoDateLocal(weekStart)}T10:00:00`;
    const grouped = groupAppointmentsByWeekDay([fakeAppt(monIso)], weekStart);
    expect(grouped.get(0)?.length).toBe(1);
    expect(grouped.get(1)?.length).toBe(0);
  });
});
