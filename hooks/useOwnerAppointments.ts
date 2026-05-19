import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAppointments,
  getDashboardKPIs,
  updateAppointmentStatus,
} from "@/services/owner/appointments";
import type { AppointmentFilters, AppointmentStatus, DashboardKPIs } from "@/types/owner";

export function useOwnerDashboardKPIs(businessId: string) {
  return useQuery<DashboardKPIs>({
    queryKey: ["owner-dashboard-kpis", businessId],
    queryFn: () => getDashboardKPIs(businessId),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useOwnerAppointments(businessId: string, filters: AppointmentFilters = {}) {
  return useQuery({
    queryKey: ["owner-appointments", businessId, filters],
    queryFn: () => getAppointments(businessId, filters),
    enabled: !!businessId,
  });
}

export function useUpdateOwnerAppointmentStatus(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: AppointmentStatus;
      reason?: string;
    }) => updateAppointmentStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-appointments", businessId] });
      queryClient.invalidateQueries({ queryKey: ["owner-dashboard-kpis", businessId] });
    },
  });
}
