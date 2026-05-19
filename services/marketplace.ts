import { api } from "@/lib/api";
import type { MarketplaceStorefrontsResponse, StorefrontDetail } from "@/types/marketplace";

export async function fetchMarketplaceStorefronts(limit = 50): Promise<MarketplaceStorefrontsResponse> {
  return api.get<MarketplaceStorefrontsResponse>(`/marketplace-storefronts?limit=${limit}`);
}

export async function fetchStorefrontBySlug(slug: string): Promise<StorefrontDetail> {
  return api.get<StorefrontDetail>(`/get-storefront?slug=${encodeURIComponent(slug)}`);
}
