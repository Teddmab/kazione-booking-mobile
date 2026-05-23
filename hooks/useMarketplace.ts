import { useInfiniteQuery } from '@tanstack/react-query';

import { MARKETPLACE_PAGE_SIZE } from '@/constants/marketplace';
import { getMarketplace } from '@/services/marketplaceService';

export { useStorefront, useStorefrontDetail } from '@/hooks/useStorefront';

export interface UseMarketplaceParams {
  category?: string;
  q?: string;
  city?: string;
  limit?: number;
}

const STALE_TIME = 5 * 60 * 1000;

export function useMarketplace(params: UseMarketplaceParams = {}) {
  const { category, q, city, limit = MARKETPLACE_PAGE_SIZE } = params;

  return useInfiniteQuery({
    queryKey: ['marketplace', { category, q, city, limit }],
    queryFn: ({ pageParam }) =>
      getMarketplace({
        search: q,
        categories: category ? [category] : undefined,
        city,
        page: pageParam as number,
        limit,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.storefronts.length, 0);
      if (loaded >= lastPage.total) return undefined;
      return allPages.length + 1;
    },
    staleTime: STALE_TIME,
  });
}

/** @deprecated Use useMarketplace */
export function useMarketplaceStorefronts(limit = 50) {
  const query = useInfiniteQuery({
    queryKey: ['marketplace-storefronts', limit],
    queryFn: () => getMarketplace({ page: 1, limit }),
    initialPageParam: 1,
    getNextPageParam: () => undefined,
    staleTime: STALE_TIME,
  });
  return {
    ...query,
    data: query.data?.pages[0],
  };
}
