import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getBusinessStorefront,
  updateBusinessStorefront,
} from "@/services/owner/business";
import {
  createStripeAccount,
  getStripeOnboardingLink,
  getStripeStatus,
} from "@/services/owner/stripeConnect";
import type { UpdateStorefrontData } from "@/types/owner";

export function useBusinessStorefront(businessId: string) {
  return useQuery({
    queryKey: ["owner-business-storefront", businessId],
    queryFn: () => getBusinessStorefront(businessId),
    enabled: !!businessId,
  });
}

export function useUpdateBusinessStorefront(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateStorefrontData & { title?: string | null }) =>
      updateBusinessStorefront(businessId, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-business-storefront", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-storefront", businessId] });
    },
  });
}

export function useStripeConnectStatus(businessId: string) {
  return useQuery({
    queryKey: ["stripe-connect", businessId],
    queryFn: () => getStripeStatus(businessId),
    enabled: !!businessId,
    retry: false,
  });
}

export function useStripeOnboarding(businessId: string) {
  return useMutation({
    mutationFn: (urls: { returnUrl: string; refreshUrl: string }) =>
      getStripeOnboardingLink(businessId, urls.returnUrl, urls.refreshUrl).catch(() =>
        createStripeAccount(businessId, urls.returnUrl, urls.refreshUrl),
      ),
  });
}
