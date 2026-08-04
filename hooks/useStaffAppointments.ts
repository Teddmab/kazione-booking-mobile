import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import {
  fetchStaffAppointments,
  respondToAppointmentOffer,
  updateAppointmentStatus,
  type AppointmentStatus,
  type PaymentMethod,
} from "@/services/staff/appointments";
import { useStaffSelf } from "@/hooks/useStaffSelf";

export function useStaffAppointments(
  dateFrom: string,
  dateTo: string,
  limit = 200,
) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data: staffSelf } = useStaffSelf();
  const staffProfileId =
    staffSelf?.staff_profile_id ?? tenant?.staffProfileId ?? "";

  return useQuery({
    queryKey: [
      "staff-appointments",
      businessId,
      staffProfileId,
      dateFrom,
      dateTo,
      limit,
    ],
    queryFn: () =>
      fetchStaffAppointments({
        businessId,
        staffProfileId: staffProfileId || undefined,
        dateFrom,
        dateTo,
        limit,
      }),
    // Staff GET is auto-scoped server-side; allow fetch even if profile id is pending
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

/** Pending appointment offers assigned to this staff (any date) */
export function useStaffOfferedAppointments() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data: staffSelf } = useStaffSelf();
  const staffProfileId =
    staffSelf?.staff_profile_id ?? tenant?.staffProfileId ?? "";

  const from = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const to = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  })();

  return useQuery({
    queryKey: ["staff-offers", businessId, staffProfileId, from, to],
    queryFn: () =>
      fetchStaffAppointments({
        businessId,
        staffProfileId: staffProfileId || undefined,
        dateFrom: from,
        dateTo: to,
        status: "offered",
        limit: 20,
      }),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function useUpdateStaffAppointmentStatus() {
  const qc = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useMutation({
    mutationFn: ({
      appointmentId,
      status,
      paymentMethod,
    }: {
      appointmentId: string;
      status: AppointmentStatus;
      paymentMethod?: PaymentMethod;
    }) =>
      updateAppointmentStatus(businessId, appointmentId, status, paymentMethod),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff-appointments"] });
      void qc.invalidateQueries({ queryKey: ["staff-offers"] });
      void qc.invalidateQueries({ queryKey: ["my-performance"] });
    },
  });
}

export function useRespondToAppointmentOffer() {
  const qc = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useMutation({
    mutationFn: ({
      appointmentId,
      response,
    }: {
      appointmentId: string;
      response: "accept" | "decline";
    }) => respondToAppointmentOffer(businessId, appointmentId, response),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff-appointments"] });
      void qc.invalidateQueries({ queryKey: ["staff-offers"] });
    },
  });
}
