import { api } from '@/lib/api';
import type { MarketplaceStorefrontsResponse, StorefrontDetail } from '@/types/marketplace';

export interface MarketplaceQueryParams {
  search?: string;
  categories?: string[];
  city?: string;
  page?: number;
  limit?: number;
}

function buildMarketplaceQuery(params: MarketplaceQueryParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.categories?.length) {
    for (const c of params.categories) {
      q.append('categories', c);
    }
  }
  if (params.city) q.set('city', params.city);
  q.set('page', String(params.page ?? 1));
  q.set('limit', String(params.limit ?? 10));
  return q.toString();
}

export async function getMarketplace(
  params: MarketplaceQueryParams = {},
): Promise<MarketplaceStorefrontsResponse> {
  const qs = buildMarketplaceQuery(params);
  return api.get<MarketplaceStorefrontsResponse>(`/marketplace-storefronts?${qs}`);
}

export async function getStorefront(slug: string): Promise<StorefrontDetail> {
  return api.get<StorefrontDetail>(`/get-storefront?slug=${encodeURIComponent(slug)}`);
}

/** @deprecated Use getMarketplace */
export const fetchMarketplaceStorefronts = (limit = 50) =>
  getMarketplace({ limit, page: 1 });

/** @deprecated Use getStorefront */
export const fetchStorefrontBySlug = getStorefront;
