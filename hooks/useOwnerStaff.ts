import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { InviteStaffValues } from "@/components/owner/InviteStaffSheet";
import type { StaffUpdateValues } from "@/components/owner/StaffDetailSheet";
import { getStaffList, inviteStaff, updateStaff } from "@/services/owner/staff";

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
