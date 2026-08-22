import { api } from "@/lib/api";

export type EntitlementType =
  | "appointment_discount"
  | "package"
  | "training"
  | "gift_voucher";

export type EntitlementStatus = "active" | "used" | "expired" | "cancelled";

/** Mirrors web `ClientEntitlement` from `/entitlements`. */
export interface ClientEntitlement {
  id: string;
  business_id: string;
  client_id: string;
  type: EntitlementType;
  name: string;
  status: EntitlementStatus;
  notes: string | null;
  discount_type: "percentage" | "fixed" | null;
  discount_value: number | null;
  service_ids: string[] | null;
  total_sessions: number | null;
  sessions_used: number;
  curriculum_text: string | null;
  original_value: number | null;
  remaining_balance: number | null;
  price_paid: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchClientEntitlements(
  businessId: string,
  clientId: string,
): Promise<ClientEntitlement[]> {
  const params = new URLSearchParams({
    business_id: businessId,
    client_id: clientId,
  });
  const data = await api.get<{ entitlements: ClientEntitlement[] }>(
    `/entitlements?${params.toString()}`,
  );
  return data.entitlements ?? [];
}
