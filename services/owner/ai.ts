import { api } from "@/lib/api";
import type { AIInsightsResponse } from "@/types/finance";

export type AIInsightPeriod = 7 | 14 | 30 | 90;

export interface ServiceSuggestion {
  field: "name" | "description" | "price" | "duration_minutes";
  suggested_value: string | null;
  reason: string;
}

export interface ServiceInsight {
  service_name: string;
  severity: "ok" | "warning" | "error";
  issues: string[];
  suggestions: ServiceSuggestion[];
}

export interface ServiceAnalysisResponse {
  analysis: ServiceInsight[];
  summary: string;
  cached: boolean;
}

export async function getAIInsights(
  businessId: string,
  periodDays: AIInsightPeriod = 30,
): Promise<AIInsightsResponse> {
  return api.post<AIInsightsResponse>("/ai-insights", {
    business_id: businessId,
    period_days: periodDays,
  });
}

export async function getServiceAnalysis(businessId: string): Promise<ServiceAnalysisResponse> {
  return api.post<ServiceAnalysisResponse>("/ai-insights", {
    business_id: businessId,
    action: "services",
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
