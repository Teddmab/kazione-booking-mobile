import { api } from "@/lib/api";

export type OfferType =
  | "appointment_discount"
  | "package"
  | "training"
  | "gift_voucher";

export interface BusinessOffer {
  id: string;
  business_id: string;
  type: OfferType;
  title: string;
  description: string | null;
  discount_type: "percentage" | "fixed_amount" | null;
  discount_value: number | null;
  applies_to_services: string[];
  price: number | null;
  currency_code: string;
  sessions_total: number | null;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  is_active: boolean;
  publish_status: "draft" | "published";
  target_audience: "client" | "staff" | "both";
  created_at: string;
}

export interface OfferRedemption {
  id: string;
  offer_id: string;
  business_id: string;
  client_id: string | null;
  sessions_total: number | null;
  sessions_used: number;
  voucher_value: number | null;
  voucher_used: number;
  amount_paid: number | null;
  status: "pending" | "active" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  business_offers?: Pick<
    BusinessOffer,
    "id" | "type" | "title" | "sessions_total" | "price" | "currency_code"
  >;
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface CreateOfferData {
  business_id: string;
  type: OfferType;
  title: string;
  description?: string;
  discount_type?: "percentage" | "fixed_amount";
  discount_value?: number;
  price?: number;
  currency_code?: string;
  sessions_total?: number;
}

export interface SellOfferData {
  business_id: string;
  offer_id: string;
  client_id?: string;
  amount_paid?: number;
  notes?: string;
}

export async function getOffers(
  businessId: string,
  includeInactive = false,
): Promise<BusinessOffer[]> {
  const params = new URLSearchParams({ business_id: businessId });
  if (includeInactive) params.set("include_inactive", "true");
  const data = await api.get<{ offers: BusinessOffer[] }>(`/offers?${params}`);
  return data.offers ?? [];
}

export async function getOfferRedemptions(
  businessId: string,
): Promise<OfferRedemption[]> {
  const params = new URLSearchParams({
    business_id: businessId,
    action: "redemptions",
  });
  const data = await api.get<{ redemptions: OfferRedemption[] }>(
    `/offers?${params}`,
  );
  return data.redemptions ?? [];
}

export async function createOffer(payload: CreateOfferData): Promise<BusinessOffer> {
  const data = await api.post<{ offer: BusinessOffer }>("/offers", payload);
  return data.offer;
}

export async function sellOffer(payload: SellOfferData): Promise<OfferRedemption> {
  const data = await api.post<{ redemption: OfferRedemption }>(
    "/offers?action=sell",
    payload,
  );
  return data.redemption;
}

export async function deactivateOffer(
  id: string,
  businessId: string,
): Promise<void> {
  await api.delete(
    `/offers?id=${encodeURIComponent(id)}&business_id=${encodeURIComponent(businessId)}`,
  );
}
