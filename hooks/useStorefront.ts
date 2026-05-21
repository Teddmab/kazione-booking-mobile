import { useQuery } from '@tanstack/react-query';

import { getStorefront } from '@/services/marketplaceService';

const STALE_TIME = 5 * 60 * 1000;

export function useStorefront(slug: string | undefined) {
  return useQuery({
    queryKey: ['storefront', slug],
    queryFn: () => getStorefront(slug!),
    staleTime: STALE_TIME,
    enabled: Boolean(slug?.trim()),
  });
}

/** @deprecated Use useStorefront */
export const useStorefrontDetail = useStorefront;
