import type { DateRange, ReportPeriodKey } from "@/types/finance";

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function dateRangeForReportPeriod(key: ReportPeriodKey): DateRange {
  const to = new Date();
  const from = new Date();

  if (key === "7d") {
    from.setDate(to.getDate() - 6);
  } else if (key === "30d") {
    from.setDate(to.getDate() - 29);
  } else if (key === "90d") {
    from.setDate(to.getDate() - 89);
  } else {
    from.setMonth(0, 1);
  }

  return { from: fmt(from), to: fmt(to) };
}
