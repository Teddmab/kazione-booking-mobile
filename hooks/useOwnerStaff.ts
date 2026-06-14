import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { InviteStaffValues } from "@/components/owner/InviteStaffSheet";
import type { StaffUpdateValues } from "@/components/owner/StaffDetailSheet";
import {
  assignStaffServices,
  getStaffList,
  getStaffServices,
  inviteStaff,
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
