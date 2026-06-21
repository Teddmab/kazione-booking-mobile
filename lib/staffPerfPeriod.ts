import { toIsoDate } from "@/lib/format";
import type { DateRange, StaffPerformanceRow } from "@/types/finance";

export type StaffPerfPeriod = "7d" | "30d" | "90d";
export type StaffPerfSort = "revenue" | "bookings" | "rating" | "completion";

export function dateRangeForStaffPeriod(period: StaffPerfPeriod): DateRange {
  const today = new Date();
  const to = toIsoDate(today);
  const fromDate = new Date(today);
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  fromDate.setDate(fromDate.getDate() - (days - 1));
  return { from: toIsoDate(fromDate), to };
}

export function sortStaffPerformance(
  rows: StaffPerformanceRow[],
  sort: StaffPerfSort,
): StaffPerformanceRow[] {
  return [...rows].sort((a, b) => {
    if (sort === "revenue") return b.revenue - a.revenue;
    if (sort === "bookings") return b.bookings - a.bookings;
    if (sort === "rating") return b.avg_rating - a.avg_rating;
    return b.completion_rate - a.completion_rate;
  });
}

export function buildStaffRankMap(sorted: StaffPerformanceRow[]): Map<string, number> {
  const map = new Map<string, number>();
  sorted.slice(0, 3).forEach((row, index) => {
    map.set(row.staff_profile_id, index + 1);
  });
  return map;
}

export function performanceScore(row: StaffPerformanceRow | undefined): number {
  if (!row) return 0;
  return row.revenue + row.bookings * 10 + row.avg_rating * 100 + row.completion_rate;
}
