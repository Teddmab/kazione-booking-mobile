import { useQuery } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import { fetchMyPerformance } from "@/services/staff/profile";

export type PeriodKey = "7d" | "30d" | "90d";

export function periodRange(key: PeriodKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (key === "7d" ? 7 : key === "30d" ? 30 : 90));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
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
