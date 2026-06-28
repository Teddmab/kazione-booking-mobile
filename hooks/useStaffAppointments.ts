import { useQuery } from "@tanstack/react-query";

import { getAppointments } from "@/services/owner/appointments";
import type { AppointmentFilters } from "@/types/owner";

export function useStaffAppointments(businessId: string, filters: AppointmentFilters = {}) {
  return useQuery({
    queryKey: ["staff-appointments", businessId, filters],
    queryFn: () => getAppointments(businessId, { ...filters, limit: filters.limit ?? 100 }),
    enabled: !!businessId,
  });
}
