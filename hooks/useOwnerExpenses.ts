import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createExpense,
  getExpenseBreakdown,
  getExpenses,
  getSupplierSpend,
} from "@/services/owner/finance";
import type { CreateExpenseData, DateRange } from "@/types/finance";

export function useExpenses(businessId: string, dateRange: DateRange) {
  return useQuery({
    queryKey: ["owner-finance", "expenses", businessId, dateRange.from, dateRange.to],
    queryFn: () => getExpenses(businessId, dateRange),
    enabled: !!businessId,
  });
}

export function useExpenseBreakdown(businessId: string, dateRange: DateRange) {
  return useQuery({
    queryKey: ["owner-finance", "expense-breakdown", businessId, dateRange.from, dateRange.to],
    queryFn: () => getExpenseBreakdown(businessId, dateRange),
    enabled: !!businessId,
  });
}

export function useSupplierSpendFinance(businessId: string, dateRange: DateRange) {
  return useQuery({
    queryKey: ["owner-finance", "supplier-spend", businessId, dateRange.from, dateRange.to],
    queryFn: () => getSupplierSpend(businessId, dateRange),
    enabled: !!businessId,
  });
}

export function useCreateExpense(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseData) => createExpense(businessId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-finance"] });
    },
  });
}
