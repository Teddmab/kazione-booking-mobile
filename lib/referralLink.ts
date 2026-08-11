import { useTenantContext } from "@/contexts/TenantContext";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { storefrontPath, storefrontServicePath } from "@/lib/storefront";

const WEB_BASE = (
  process.env.EXPO_PUBLIC_WEB_APP_URL ?? "https://kazione.app"
).replace(/\/$/, "");

/**
 * Staff referral / share links — same URLs as web staff portal.
 *
 * Salon (Performance « Copy referral link »):
 *   {WEB}/client/{segment}/{slug}?ref={staffProfileId}
 *
 * Service (Services « Share »):
 *   {WEB}/client/{segment}/{slug}/service/{serviceId}?ref={staffProfileId}
 */
export function buildStaffReferralLink(
  slug: string,
  staffProfileId: string,
  options?: {
    businessType?: string | null;
    serviceId?: string;
  },
): string {
  const businessType = options?.businessType ?? null;
  const path = options?.serviceId
    ? storefrontServicePath(slug, businessType, options.serviceId)
    : storefrontPath(slug, businessType);
  return `${WEB_BASE}${path}?ref=${encodeURIComponent(staffProfileId)}`;
}

export function useStaffReferralLink(serviceId?: string): string | null {
  const { tenant } = useTenantContext();
  const { data: self } = useStaffSelf();

  const slug = tenant?.slug;
  const staffProfileId =
    self?.staff_profile_id ?? tenant?.staffProfileId ?? null;

  if (!slug || !staffProfileId) return null;

  return buildStaffReferralLink(slug, staffProfileId, {
    businessType: tenant?.businessType,
    serviceId,
  });
}
