import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { InviteStaffValues } from "@/components/owner/InviteStaffSheet";
import type { StaffUpdateValues } from "@/components/owner/StaffDetailSheet";
import {
  assignStaffServices,
  getStaffCommissions,
  getStaffDetail,
  getStaffList,
  getStaffServices,
  inviteStaff,
  payCommissions,
  resendStaffInvite,
  updateStaff,
  updateStaffSchedule,
} from "@/services/owner/staff";
import type { StaffWorkingDay } from "@/types/owner";

export function useOwnerStaff(businessId: string) {
  return useQuery({
    queryKey: ["owner-staff", businessId],
    queryFn: () => getStaffList(businessId),
    enabled: !!businessId,
  });
}

export function useInviteStaff(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InviteStaffValues) =>
      inviteStaff({
        business_id: businessId,
        email: values.email.trim().toLowerCase(),
        display_name: `${values.first_name.trim()} ${values.last_name.trim()}`.trim(),
        role: values.role,
        position: values.position.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-staff", businessId] });
    },
  });
}

export function useUpdateStaffMember(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: StaffUpdateValues }) =>
      updateStaff(id, {
        display_name: values.display_name,
        position: values.position.trim() || null,
        role: values.role,
        is_active: values.is_active,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-staff", businessId] });
    },
  });
}

export function useStaffSchedule(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, schedule }: { staffId: string; schedule: StaffWorkingDay[] }) =>
      updateStaffSchedule(staffId, schedule),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-staff", businessId] });
    },
  });
}

export function useStaffServices(staffId: string | null) {
  return useQuery({
    queryKey: ["owner-staff-services", staffId],
    queryFn: () => getStaffServices(staffId!),
    enabled: !!staffId,
  });
}

export function useAssignStaffServices(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, serviceIds }: { staffId: string; serviceIds: string[] }) =>
      assignStaffServices(staffId, serviceIds),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["owner-staff-services", vars.staffId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-staff", businessId] });
    },
  });
}

export function useResendStaffInvite(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => resendStaffInvite(staffId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-staff", businessId] });
    },
  });
}

export function useActivateStaffInvite(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => updateStaff(staffId, { is_active: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-staff", businessId] });
    },
  });
}

export function useStaffDetail(staffId: string | null, businessId: string) {
  return useQuery({
    queryKey: ["owner-staff-detail", staffId, businessId],
    queryFn: () => getStaffDetail(staffId!, businessId),
    enabled: !!staffId && !!businessId,
    staleTime: 30_000,
  });
}

export function useStaffCommissions(
  staffId: string | null,
  businessId: string,
  params: { status?: "all" | "unpaid" } = {},
) {
  return useQuery({
    queryKey: ["owner-staff-commissions", staffId, businessId, params],
    queryFn: () => getStaffCommissions(staffId!, businessId, params),
    enabled: !!staffId && !!businessId,
    staleTime: 30_000,
  });
}

export function usePayCommissions(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentIds,
      payMethod,
    }: {
      appointmentIds: string[];
      payMethod: "cash" | "bank_transfer" | "offset";
    }) => payCommissions(businessId, appointmentIds, payMethod),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-staff-commissions"] });
      void queryClient.invalidateQueries({ queryKey: ["owner-appointments"] });
    },
  });
}
