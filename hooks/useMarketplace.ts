import { useQuery } from "@tanstack/react-query";

import { fetchMarketplaceStorefronts, fetchStorefrontBySlug } from "@/services/marketplace";

export function useMarketplaceStorefronts(limit = 50) {
  return useQuery({
    queryKey: ["marketplace-storefronts", limit],
    queryFn: () => fetchMarketplaceStorefronts(limit),
    staleTime: 60_000,
  });
}

export function useStorefrontDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ["storefront", slug],
    queryFn: () => fetchStorefrontBySlug(slug!),
    enabled: !!slug,
    staleTime: 60_000,
  });
}
