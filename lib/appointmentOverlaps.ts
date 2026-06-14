import type { AppointmentWithRelations } from "@/types/owner";

export interface OverlapPair {
  key: string;
  staffName: string;
  a: AppointmentWithRelations;
  b: AppointmentWithRelations;
}

/** Detect double-bookings per staff within the next 7 days. */
export function computeStaffOverlaps(
  upcomingAppointments: AppointmentWithRelations[],
): OverlapPair[] {
  const in7days = Date.now() + 7 * 24 * 3600 * 1000;

  const relevant = upcomingAppointments.filter(
    (a) =>
      a.staff_profile_id &&
      !["cancelled", "no_show"].includes(a.status) &&
      new Date(a.starts_at).getTime() <= in7days,
  );

  const byStaff = new Map<string, AppointmentWithRelations[]>();
  for (const a of relevant) {
    const sid = a.staff_profile_id!;
    if (!byStaff.has(sid)) byStaff.set(sid, []);
    byStaff.get(sid)!.push(a);
  }

  const result: OverlapPair[] = [];
  const seen = new Set<string>();

  for (const [, appts] of byStaff) {
    const sorted = [...appts].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const A = sorted[i];
      const B = sorted[i + 1];
      const aEnds = new Date(A.starts_at).getTime() + A.duration_minutes * 60_000;
      if (new Date(B.starts_at).getTime() < aEnds) {
        const key = [A.id, B.id].sort().join("|");
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            key,
            staffName: A.staff?.display_name ?? "Équipe",
            a: A,
            b: B,
          });
        }
      }
    }
  }

  return result;
}
