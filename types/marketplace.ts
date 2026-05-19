/** List item from `GET /marketplace-storefronts` (same shape as web BrowseSalons). */
export interface StorefrontSummary {
  id: string;
  business_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  city: string | null;
  marketplace_categories: string[];
  marketplace_tags: string[];
  marketplace_headline: string | null;
  avg_rating: number;
  review_count: number;
  services_preview: { id: string; name: string; price: number }[];
}

export interface MarketplaceStorefrontsResponse {
  storefronts: StorefrontSummary[];
  total: number;
}

/** Subset of `get-storefront` payload used on mobile (extend as screens grow). */
export interface StorefrontDetail {
  id: string;
  businessId: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  currencyCode: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  services: {
    id: string;
    name: string;
    category: string;
    duration: string;
    price: number;
    popular: boolean;
    description: string | null;
  }[];
  sections?: { team: boolean; services: boolean };
  team?: {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatar: string | null;
    specialties: string[];
    serviceIds: string[];
  }[];
}
