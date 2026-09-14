import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import {
  fetchStaffAppointments,
  markArrived,
  markNotesReviewed,
  respondToAppointmentOffer,
  updateAppointmentStatus,
  type AppointmentStatus,
  type PaymentMethod,
} from "@/services/staff/appointments";
import { useStaffSelf } from "@/hooks/useStaffSelf";

function localDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function useStaffAppointments(
  dateFrom: string,
  dateTo: string,
  limit = 200,
  scope: "auto" | "mine" | "all" = "auto",
) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data: staffSelf } = useStaffSelf();
  const staffProfileId =
    staffSelf?.staff_profile_id ?? tenant?.staffProfileId ?? "";
  const settingsQ = useBusinessSettings(businessId);
  const seeAllSetting =
    settingsQ.data?.settings?.staff_see_all_appointments === true;
  const seeAll =
    scope === "all" ? true : scope === "mine" ? false : seeAllSetting;
  const staffFilter = seeAll ? undefined : staffProfileId || undefined;

  return useQuery({
    queryKey: [
      "staff-appointments",
      businessId,
      seeAll ? "all" : staffProfileId,
      scope,
      dateFrom,
      dateTo,
      limit,
    ],
    queryFn: () =>
      fetchStaffAppointments({
        businessId,
        staffProfileId: staffFilter,
        dateFrom,
        dateTo,
        limit,
      }),
    // Staff GET is auto-scoped server-side; allow fetch even if profile id is pending
    enabled: !!businessId,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

/** Pending appointment offers assigned to this staff (any date) */
export function useStaffOfferedAppointments() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data: staffSelf } = useStaffSelf();
  const staffProfileId =
    staffSelf?.staff_profile_id ?? tenant?.staffProfileId ?? "";

  const from = localDateOffset(-7);
  const to = localDateOffset(90);

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

/** Completions awaiting owner confirmation */
export function useStaffPendingCompletionAppointments() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data: staffSelf } = useStaffSelf();
  const staffProfileId =
    staffSelf?.staff_profile_id ?? tenant?.staffProfileId ?? "";

  const from = localDateOffset(-30);
  const to = localDateOffset(7);

  return useQuery({
    queryKey: ["staff-pending-completion", businessId, staffProfileId, from, to],
    queryFn: () =>
      fetchStaffAppointments({
        businessId,
        staffProfileId: staffProfileId || undefined,
        dateFrom: from,
        dateTo: to,
        status: "pending_completion",
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
      void qc.invalidateQueries({ queryKey: ["staff-pending-completion"] });
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

function invalidateStaffApptQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["staff-appointments"] });
  void qc.invalidateQueries({ queryKey: ["staff-offers"] });
  void qc.invalidateQueries({ queryKey: ["staff-pending-completion"] });
}

export function useMarkArrived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => markArrived(appointmentId),
    onSuccess: () => invalidateStaffApptQueries(qc),
  });
}

export function useMarkNotesReviewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => markNotesReviewed(appointmentId),
    onSuccess: () => invalidateStaffApptQueries(qc),
  });
}
