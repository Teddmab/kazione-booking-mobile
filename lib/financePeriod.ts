import type { FinancePeriodKey, DateRange } from "@/types/finance";
import { toIsoDate } from "@/lib/format";

export function dateRangeForPeriod(
  period: FinancePeriodKey,
  custom?: DateRange,
): DateRange {
  const today = new Date();
  const to = toIsoDate(today);

  if (period === "custom" && custom?.from && custom?.to) {
    return custom;
  }

  if (period === "today") {
    return { from: to, to };
  }

  if (period === "week") {
    const fromDate = new Date(today);
    const day = fromDate.getDay();
    const diff = day === 0 ? 6 : day - 1;
    fromDate.setDate(fromDate.getDate() - diff);
    return { from: toIsoDate(fromDate), to };
  }

  if (period === "month") {
    const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toIsoDate(fromDate), to };
  }

  // custom fallback: last 30 days
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 30);
  return { from: toIsoDate(fromDate), to };
}

export function monthToDateRange(): DateRange {
  return dateRangeForPeriod("month");
}

export function formatChartLabel(isoPeriod: string, language = "en"): string {
  const d = new Date(isoPeriod);
  if (Number.isNaN(d.getTime())) return isoPeriod.slice(5, 10);
  return d.toLocaleDateString(
    language.startsWith("fr") ? "fr-FR" : language.startsWith("et") ? "et-EE" : "en-GB",
    { day: "numeric", month: "short" },
  );
}

export function mapStatusFilterToApi(
  filter: import("@/types/finance").TransactionStatusFilter,
): string[] | undefined {
  if (filter === "all") return undefined;
  if (filter === "completed") return ["completed"];
  if (filter === "cancelled") return ["cancelled"];
  if (filter === "refunded") return ["refunded"];
  return undefined;
}
