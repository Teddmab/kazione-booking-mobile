import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import {
  deleteSelfOverride,
  fetchMyCommissions,
  fetchStaffSelf,
  getSelfOverrides,
  updateBankAccount,
  updateSelfProfile,
  updateSelfSchedule,
  upsertSelfOverride,
  type CommissionLedgerResult,
  type StaffOverride,
  type StaffScheduleDay,
  type UpdateBankAccountInput,
} from "@/services/staff/profile";

export function useStaffSelf() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useQuery({
    queryKey: ["staff-self", businessId],
    queryFn: () => fetchStaffSelf(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSelfProfile() {
  const qc = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useMutation({
    mutationFn: (fields: { display_name?: string }) => updateSelfProfile(fields),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff-self", businessId] });
    },
  });
}

export function useUpdateSelfSchedule() {
  const qc = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useMutation({
    mutationFn: (schedule: StaffScheduleDay[]) => updateSelfSchedule(schedule),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff-self", businessId] });
    },
  });
}

export function useSelfOverrides(from?: string, to?: string) {
  return useQuery({
    queryKey: ["staff-overrides", from, to],
    queryFn: () => getSelfOverrides(from, to),
    enabled: !!from && !!to,
    staleTime: 60_000,
  });
}

export function useUpsertSelfOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (override: Omit<StaffOverride, "id">) => upsertSelfOverride(override),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff-overrides"] });
    },
  });
}

export function useDeleteSelfOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => deleteSelfOverride(date),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff-overrides"] });
    },
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  return useMutation({
    mutationFn: (input: UpdateBankAccountInput) => updateBankAccount(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff-self", businessId] });
    },
  });
}

export function useMyCommissions(params: {
  from?: string;
  to?: string;
  status?: "all" | "unpaid";
}) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  return useQuery<CommissionLedgerResult>({
    queryKey: ["my-commissions", businessId, params],
    queryFn: () => fetchMyCommissions({ ...params, business_id: businessId }),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}
