import { api } from "@/lib/api";
import type { AppointmentWithRelations, PaginatedAppointments } from "@/types/owner";

export type AppointmentStatus =
  | "offered"
  | "pending"
  | "confirmed"
  | "arrived"
  | "in_progress"
  | "pending_completion"
  | "completed"
  | "no_show"
  | "cancelled";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "voucher"
  | "online";

export interface StaffAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes?: string | null;
  notes_reviewed_at?: string | null;
  referral_staff_id?: string | null;
  payment_method?: string | null;
  intake_answers?: Record<string, { label: string; value: unknown }> | null;
  price: number;
  duration_minutes: number;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
    currency_code?: string;
  };
}

type AppointmentRow = AppointmentWithRelations & {
  referral_staff_id?: string | null;
  referrer_staff_id?: string | null;
  notes_reviewed_at?: string | null;
  payment_method?: string | null;
  intake_answers?: Record<string, { label: string; value: unknown }> | null;
};

function mapAppointment(row: AppointmentRow): StaffAppointment {
  return {
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status as AppointmentStatus,
    notes: row.notes ?? null,
    notes_reviewed_at: row.notes_reviewed_at ?? null,
    referral_staff_id:
      row.referrer_staff_id ?? row.referral_staff_id ?? null,
    payment_method: row.payment_method ?? row.payment?.method ?? null,
    intake_answers: row.intake_answers ?? null,
    price: row.price,
    duration_minutes: row.duration_minutes,
    client: {
      id: row.client.id,
      first_name: row.client.first_name,
      last_name: row.client.last_name,
      phone: row.client.phone ?? undefined,
      email: row.client.email ?? undefined,
    },
    service: {
      id: row.service.id,
      name: row.service.name,
      duration_minutes: row.service.duration_minutes,
      price: row.service.price,
    },
  };
}

export async function fetchStaffAppointments(params: {
  businessId: string;
  staffProfileId?: string;
  dateFrom: string;
  dateTo: string;
  status?: string;
  limit?: number;
}): Promise<StaffAppointment[]> {
  const search = new URLSearchParams({
    business_id: params.businessId,
    date_from: params.dateFrom,
    date_to: params.dateTo,
    page: "1",
    limit: String(params.limit ?? 200),
  });
  if (params.staffProfileId) {
    search.set("staff_id", params.staffProfileId);
  }
  if (params.status) {
    search.set("status", params.status);
  }

  const data = await api.get<PaginatedAppointments>(`/appointments?${search}`);
  return (data.appointments ?? []).map((row) =>
    mapAppointment(row as AppointmentRow),
  );
}

export async function updateAppointmentStatus(
  businessId: string,
  appointmentId: string,
  status: AppointmentStatus,
  paymentMethod?: PaymentMethod,
): Promise<void> {
  await api.patch(`/appointments?id=${encodeURIComponent(appointmentId)}`, {
    business_id: businessId,
    status,
    ...(paymentMethod ? { payment_method: paymentMethod } : {}),
  });
}

export async function respondToAppointmentOffer(
  businessId: string,
  appointmentId: string,
  response: "accept" | "decline",
): Promise<void> {
  await api.patch("/appointments?action=respond-offer", {
    appointment_id: appointmentId,
    business_id: businessId,
    response,
  });
}

export async function updateAppointmentNotes(
  businessId: string,
  appointmentId: string,
  notes: string,
): Promise<void> {
  await api.patch(`/appointments?id=${encodeURIComponent(appointmentId)}`, {
    business_id: businessId,
    notes,
  });
}

export async function markArrived(appointmentId: string): Promise<void> {
  await api.patch(
    `/appointments?action=mark-arrived&id=${encodeURIComponent(appointmentId)}`,
    {},
  );
}

export async function markNotesReviewed(appointmentId: string): Promise<void> {
  await api.patch(
    `/appointments?action=mark-notes-reviewed&id=${encodeURIComponent(appointmentId)}`,
    {},
  );
}
