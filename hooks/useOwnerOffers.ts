import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOffer,
  deactivateOffer,
  getOfferRedemptions,
  getOffers,
  sellOffer,
  type CreateOfferData,
  type SellOfferData,
} from "@/services/owner/offers";

export function useOwnerOffers(businessId: string, includeInactive = false) {
  return useQuery({
    queryKey: ["owner-offers", businessId, includeInactive],
    queryFn: () => getOffers(businessId, includeInactive),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useOwnerOfferRedemptions(businessId: string) {
  return useQuery({
    queryKey: ["owner-offer-redemptions", businessId],
    queryFn: () => getOfferRedemptions(businessId),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function useCreateOwnerOffer(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CreateOfferData, "business_id">) =>
      createOffer({ ...data, business_id: businessId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-offers", businessId] });
    },
  });
}

export function useSellOwnerOffer(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SellOfferData, "business_id">) =>
      sellOffer({ ...data, business_id: businessId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-offer-redemptions", businessId] });
    },
  });
}

export function useDeactivateOwnerOffer(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateOffer(id, businessId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-offers", businessId] });
    },
  });
}
