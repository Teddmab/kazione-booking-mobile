import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getIncomeBreakdown,
  getRevenueSummary,
  getStaffPerformance,
  getTransactions,
} from "@/services/owner/finance";
import type {
  DateRange,
  FinancePeriodKey,
  TransactionFilters,
  TransactionStatusFilter,
} from "@/types/finance";
import { dateRangeForPeriod } from "@/lib/financePeriod";

export function useRevenueSummary(businessId: string, period: FinancePeriodKey, custom?: DateRange) {
  const range = dateRangeForPeriod(period, custom);
  return useQuery({
    queryKey: ["owner-finance", "revenue", businessId, range.from, range.to],
    queryFn: () => getRevenueSummary(businessId, range),
    enabled: !!businessId,
  });
}

export function useRevenueBreakdown(
  businessId: string,
  period: FinancePeriodKey,
  custom?: DateRange,
) {
  const range = dateRangeForPeriod(period, custom);
  return useQuery({
    queryKey: ["owner-finance", "breakdown", businessId, range.from, range.to],
    queryFn: () => getIncomeBreakdown(businessId, range, "day"),
    enabled: !!businessId,
  });
}

export function useStaffPerformanceFinance(
  businessId: string,
  period: FinancePeriodKey,
  custom?: DateRange,
) {
  const range = dateRangeForPeriod(period, custom);
  return useQuery({
    queryKey: ["owner-finance", "staff-perf", businessId, range.from, range.to],
    queryFn: () => getStaffPerformance(businessId, range),
    enabled: !!businessId,
  });
}

export function useTransactions(
  businessId: string,
  status: TransactionStatusFilter,
  dateRange: DateRange,
) {
  const filters: TransactionFilters = {
    status,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    limit: 20,
  };

  return useInfiniteQuery({
    queryKey: ["owner-finance", "transactions", businessId, status, dateRange.from, dateRange.to],
    queryFn: ({ pageParam = 1 }) =>
      getTransactions(businessId, { ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const loaded = lastPageParam * (filters.limit ?? 20);
      return loaded < lastPage.total ? lastPageParam + 1 : undefined;
    },
    enabled: !!businessId,
  });
}
