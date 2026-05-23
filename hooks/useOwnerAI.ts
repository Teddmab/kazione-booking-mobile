import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { askFinanceQuestion, getAIInsights, type AIInsightPeriod } from "@/services/owner/ai";

export function useAIInsights(businessId: string, periodDays: AIInsightPeriod = 30) {
  return useQuery({
    queryKey: ["owner-ai", "insights", businessId, periodDays],
    queryFn: () => getAIInsights(businessId, periodDays),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useAIFinanceChat(businessId: string, periodDays: AIInsightPeriod = 30) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (question: string) => askFinanceQuestion(businessId, question, periodDays),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["owner-ai", "insights", businessId],
      });
    },
  });
}
