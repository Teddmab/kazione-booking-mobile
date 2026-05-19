import { api } from "@/lib/api";

export interface PawapayPaymentParams {
  appointmentId: string;
  businessId: string;
  phone: string;
  operatorCode: string;
  amount: string;
  currency: string;
}

export async function createPawapayPayment(
  params: PawapayPaymentParams,
): Promise<{ status?: string }> {
  return api.post<{ status?: string }>("/pawapay-payment", {
    appointmentId: params.appointmentId,
    businessId: params.businessId,
    phone: params.phone,
    operatorCode: params.operatorCode,
    amount: params.amount,
    currency: params.currency,
  });
}

export type AppointmentPollResponse =
  | { status?: string }
  | { appointment?: { status?: string } };

export async function fetchAppointmentById(id: string): Promise<AppointmentPollResponse> {
  return api.get<AppointmentPollResponse>(`/appointments?id=${encodeURIComponent(id)}`);
}

export function appointmentStatusFromPoll(res: AppointmentPollResponse): string | undefined {
  if ("appointment" in res && res.appointment?.status) {
    return res.appointment.status;
  }
  if ("status" in res && typeof res.status === "string") {
    return res.status;
  }
  return undefined;
}
