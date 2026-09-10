import { useQuery } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import { fetchMyPerformance } from "@/services/staff/profile";

export type PeriodKey = "7d" | "30d" | "90d";

export function periodRange(key: PeriodKey): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const now = new Date();

  if (key === "7d") {
    // Current calendar week (Mon–Sun) — matches activity staff see on Today.
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return { from: fmt(from), to: fmt(to) };
  }

  if (key === "30d") {
    // Full calendar month — same window as Today "Votre activité".
    return calendarMonthRange();
  }

  const from = new Date(now);
  from.setDate(from.getDate() - 90);
  return { from: fmt(from), to: fmt(now) };
}

export function calendarMonthRange(): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const to = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(last)}`;
  return { from, to };
}

export function useMyPerformance(period: PeriodKey) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { from, to } = periodRange(period);

  return useQuery({
    queryKey: ["my-performance", businessId, period],
    queryFn: () => fetchMyPerformance(businessId, from, to),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}

export function useMyPerformanceRange(from: string, to: string) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useQuery({
    queryKey: ["my-performance", businessId, from, to],
    queryFn: () => fetchMyPerformance(businessId, from, to),
    enabled: !!businessId && !!from && !!to,
    staleTime: 5 * 60_000,
  });
}
