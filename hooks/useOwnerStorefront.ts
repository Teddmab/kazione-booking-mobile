import { useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addPromotion,
  deleteGalleryImage,
  getGalleryImages,
  getOwnerStorefront,
  getStorefrontPromotions,
  removePromotion,
  setStorefrontPublished,
  updateStorefront,
  uploadCoverImage,
  uploadGalleryImage,
} from "@/services/owner/storefront";
import type { StorefrontPromotion, UpdateStorefrontData } from "@/types/owner";

const STOREFRONT_KEY = "owner-storefront";
const GALLERY_KEY = "owner-storefront-gallery";
const PROMOTIONS_KEY = "owner-storefront-promotions";

export function useOwnerStorefront(businessId: string) {
  return useQuery({
    queryKey: [STOREFRONT_KEY, businessId],
    queryFn: () => getOwnerStorefront(businessId),
    enabled: !!businessId,
  });
}

export function useGalleryImages(businessId: string) {
  return useQuery({
    queryKey: [GALLERY_KEY, businessId],
    queryFn: () => getGalleryImages(businessId),
    enabled: !!businessId,
  });
}

export function useStorefrontPromotions(businessId: string) {
  return useQuery({
    queryKey: [PROMOTIONS_KEY, businessId],
    queryFn: () => getStorefrontPromotions(businessId),
    enabled: !!businessId,
  });
}

export function useUpdateStorefront(businessId: string) {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: (data: UpdateStorefrontData) => updateStorefront(businessId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [STOREFRONT_KEY, businessId] });
    },
  });

  const debouncedSave = useCallback(
    (data: UpdateStorefrontData) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => mutation.mutate(data), 600);
    },
    [mutation],
  );

  const saveNow = useCallback(
    (data: UpdateStorefrontData) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      mutation.mutate(data);
    },
    [mutation],
  );

  return { ...mutation, debouncedSave, saveNow };
}

export function useUploadCoverImage(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uri: string) => uploadCoverImage(businessId, uri),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [STOREFRONT_KEY, businessId] });
    },
  });
}

export function useUploadGalleryImage(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storefrontId, uri }: { storefrontId: string; uri: string }) =>
      uploadGalleryImage(storefrontId, businessId, uri),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [GALLERY_KEY, businessId] });
    },
  });
}

export function useDeleteGalleryImage(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ galleryId, imageUrl }: { galleryId: string; imageUrl: string }) =>
      deleteGalleryImage(galleryId, imageUrl),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [GALLERY_KEY, businessId] });
    },
  });
}

export function useAddPromotion(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promo: { title: string; description?: string; valid_until?: string | null }) =>
      addPromotion(businessId, promo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PROMOTIONS_KEY, businessId] });
    },
  });
}

export function useRemovePromotion(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promoId: string) => removePromotion(businessId, promoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PROMOTIONS_KEY, businessId] });
    },
  });
}

export function usePublishStorefront(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publish: boolean) => setStorefrontPublished(businessId, publish),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [STOREFRONT_KEY, businessId] });
    },
  });
}

export type { StorefrontPromotion };
