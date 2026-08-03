import { useTenantContext } from "@/contexts/TenantContext";
import { useStaffSelf } from "@/hooks/useStaffSelf";

const WEB_BASE = (
  process.env.EXPO_PUBLIC_WEB_APP_URL ?? "https://kazione.app"
).replace(/\/$/, "");

/**
 * Personal referral link for the logged-in staff member.
 * Format: {WEB}/client/salon/{slug}?ref={staffProfileId}[&service=...]
 */
export function useStaffReferralLink(serviceId?: string): string | null {
  const { tenant } = useTenantContext();
  const { data: self } = useStaffSelf();

  const slug = tenant?.slug;
  const staffProfileId =
    self?.staff_profile_id ?? tenant?.staffProfileId ?? null;

  if (!slug || !staffProfileId) return null;

  const params = new URLSearchParams({ ref: staffProfileId });
  if (serviceId) params.set("service", serviceId);

  return `${WEB_BASE}/client/salon/${slug}?${params.toString()}`;
}

export function buildStaffReferralLink(
  slug: string,
  staffProfileId: string,
  serviceId?: string,
): string {
  const params = new URLSearchParams({ ref: staffProfileId });
  if (serviceId) params.set("service", serviceId);
  return `${WEB_BASE}/client/salon/${slug}?${params.toString()}`;
}
