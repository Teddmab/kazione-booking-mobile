/** List item from `GET /marketplace-storefronts`. */
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

/** Alias used by SalonCard — maps from StorefrontSummary. */
export interface SalonListItem {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  cover_image_url: string | null;
  rating: number;
  review_count: number;
  city: string | null;
  top_services: string[];
  is_featured: boolean;
  categories: string[];
}

export function toSalonListItem(s: StorefrontSummary): SalonListItem {
  return {
    id: s.id,
    slug: s.slug,
    name: s.title,
    logo_url: s.logo_url,
    cover_image_url: s.cover_image_url,
    rating: s.avg_rating,
    review_count: s.review_count,
    city: s.city,
    top_services: s.services_preview.map((p) => p.name),
    is_featured: false,
    categories: s.marketplace_categories ?? [],
  };
}

export interface StorefrontService {
  id: string;
  name: string;
  category: string;
  categoryId: string | null;
  description: string;
  duration: string;
  durationMin: number;
  price: number;
  currency: string;
  popular: boolean;
  imageUrl: string | null;
  displayOrder: number;
}

export interface StorefrontStaffMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string | null;
  specialties: string[];
  serviceIds: string[];
}

export interface StorefrontPromotion {
  id: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  badge: string | null;
  validFrom: string | null;
  validUntil: string | null;
  appliesTo: string[];
}

export interface StorefrontGalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  displayOrder: number;
}

export interface StorefrontContact {
  address: string | null;
  city: string | null;
  countryCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export interface StorefrontSections {
  hero: boolean;
  about: boolean;
  services: boolean;
  promotions: boolean;
  gallery: boolean;
  team: boolean;
  reviews: boolean;
  booking: boolean;
}

/** Full payload from `GET /get-storefront?slug=`. */
export interface StorefrontDetail {
  id: string;
  businessId: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  extendedDescription: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  accentColor: string;
  verified: boolean;
  currencyCode: string;
  countryCode: string | null;
  headline: string | null;
  tags: string[];
  categories: string[];
  featured: boolean;
  rating: number;
  reviewCount: number;
  sections: StorefrontSections;
  contact: StorefrontContact;
  services: StorefrontService[];
  team: StorefrontStaffMember[];
  promotions: StorefrontPromotion[];
  gallery: StorefrontGalleryImage[];
}

/** @deprecated Use StorefrontDetail */
export type StorefrontSalon = StorefrontDetail;
