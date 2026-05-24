import { api } from "@/lib/api";

export interface StripeAccountStatus {
  connected: boolean;
  account_id: string | null;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}

export async function getStripeStatus(businessId: string): Promise<StripeAccountStatus> {
  return api.post<StripeAccountStatus>("/stripe-connect", {
    action: "get-status",
    business_id: businessId,
  });
}

export async function getStripeOnboardingLink(
  businessId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<{ onboarding_url: string }> {
  return api.post<{ onboarding_url: string }>("/stripe-connect", {
    action: "get-onboarding-link",
    business_id: businessId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });
}

export async function createStripeAccount(
  businessId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<{ account_id: string; onboarding_url: string }> {
  return api.post<{ account_id: string; onboarding_url: string }>("/stripe-connect", {
    action: "create-account",
    business_id: businessId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });
}
