import { api } from "@/lib/api";

export interface PayPalStatus {
  connected: boolean;
  paypal_email: string | null;
  merchant_id: string | null;
  status?: string;
}

export async function getPayPalStatus(businessId: string): Promise<PayPalStatus> {
  return api.post<PayPalStatus>("/paypal-connect", {
    action: "get-status",
    business_id: businessId,
  });
}

export async function connectPayPal(
  businessId: string,
  paypalEmail: string,
): Promise<PayPalStatus> {
  return api.post<PayPalStatus>("/paypal-connect", {
    action: "connect",
    business_id: businessId,
    paypal_email: paypalEmail,
  });
}

export async function disconnectPayPal(businessId: string): Promise<{ connected: false }> {
  return api.post<{ connected: false }>("/paypal-connect", {
    action: "disconnect",
    business_id: businessId,
  });
}
