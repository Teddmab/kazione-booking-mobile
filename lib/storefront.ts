/**
 * Maps a business type to the URL segment used in storefront routes.
 * Mirrors web `src/lib/storefront.ts`.
 *
 * Route shape: /client/:segment/:slug
 */
export type StorefrontSegment = "salon" | "spa" | "studio" | "services";

export function getStorefrontSegment(
  businessType: string | null | undefined,
): StorefrontSegment {
  switch (businessType) {
    case "spa":
    case "wellness":
    case "massage_studio":
    case "massage":
      return "spa";
    case "fitness":
    case "gym":
    case "yoga_studio":
    case "yoga":
    case "pilates":
    case "professional_services":
      return "studio";
    case "cleaning_service":
    case "home_services":
      return "services";
    default:
      return "salon";
  }
}

export function storefrontPath(
  slug: string,
  businessType: string | null | undefined,
): string {
  return `/client/${getStorefrontSegment(businessType)}/${slug}`;
}

export function storefrontServicePath(
  slug: string,
  businessType: string | null | undefined,
  serviceId: string,
): string {
  return `/client/${getStorefrontSegment(businessType)}/${slug}/service/${serviceId}`;
}
