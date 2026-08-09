import { api } from "@/lib/api";

export type OfferStatus = "pending" | "accepted" | "declined";

export type CommissionType = "none" | "percentage" | "fixed" | null;

export interface StaffService {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  category_name: string | null;
  duration_minutes: number;
  price: number;
  effective_price: number;
  currency_code: string;
  is_active: boolean;
  image_url: string | null;
  image_url_2?: string | null;
  assignment_status: OfferStatus;
  offered_commission_type: CommissionType;
  offered_commission_value: number | null;
  staff_commission_type?: CommissionType;
  staff_commission_value?: number | null;
}

export async function fetchStaffServices(
  businessId: string,
): Promise<StaffService[]> {
  const data = await api.get<StaffService[] | { services: StaffService[] }>(
    `/services?business_id=${encodeURIComponent(businessId)}`,
  );
  return Array.isArray(data) ? data : (data.services ?? []);
}

export async function respondToServiceOffer(
  businessId: string,
  serviceId: string,
  response: "accepted" | "declined",
): Promise<{ success: boolean; service_id: string; status: string }> {
  return api.patch<{ success: boolean; service_id: string; status: string }>(
    "/staff?action=respond-service-offer",
    {
      service_id: serviceId,
      business_id: businessId,
      response,
    },
  );
}
