import { api } from "@/lib/api";
import type { AIInsightsResponse } from "@/types/finance";

export type AIInsightPeriod = 7 | 14 | 30 | 90;

export async function getAIInsights(
  businessId: string,
  periodDays: AIInsightPeriod = 30,
): Promise<AIInsightsResponse> {
  return api.post<AIInsightsResponse>("/ai-insights", {
    business_id: businessId,
    period_days: periodDays,
  });
}

export async function askFinanceQuestion(
  businessId: string,
  question: string,
  periodDays: AIInsightPeriod = 30,
): Promise<AIInsightsResponse> {
  return api.post<AIInsightsResponse>("/ai-finance", {
    business_id: businessId,
    period_days: periodDays,
    question,
  });
}
