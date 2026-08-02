import { api } from "@/lib/api";
import type { AppointmentWithRelations, PaginatedAppointments } from "@/types/owner";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "no_show"
  | "cancelled";

export interface StaffAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes?: string;
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
  };
}

function mapAppointment(row: AppointmentWithRelations): StaffAppointment {
  return {
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status as AppointmentStatus,
    notes: row.notes ?? undefined,
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
}): Promise<StaffAppointment[]> {
  const search = new URLSearchParams({
    business_id: params.businessId,
    date_from: params.dateFrom,
    date_to: params.dateTo,
    page: "1",
    limit: "200",
  });
  // Backend auto-filters for staff role; staff_id helps when available
  if (params.staffProfileId) {
    search.set("staff_id", params.staffProfileId);
  }

  const data = await api.get<PaginatedAppointments>(`/appointments?${search}`);
  return (data.appointments ?? []).map(mapAppointment);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  reason?: string,
): Promise<void> {
  await api.patch(`/appointments?id=${encodeURIComponent(appointmentId)}`, {
    status,
    reason,
  });
}
