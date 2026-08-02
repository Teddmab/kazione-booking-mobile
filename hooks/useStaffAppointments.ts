import { useQuery } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import { fetchStaffAppointments } from "@/services/staff/appointments";
import { useStaffSelf } from "@/hooks/useStaffSelf";

export function useStaffAppointments(dateFrom: string, dateTo: string) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data: staffSelf } = useStaffSelf();
  const staffProfileId =
    staffSelf?.staff_profile_id ?? tenant?.staffProfileId ?? "";

  return useQuery({
    queryKey: ["staff-appointments", businessId, staffProfileId, dateFrom, dateTo],
    queryFn: () =>
      fetchStaffAppointments({
        businessId,
        staffProfileId: staffProfileId || undefined,
        dateFrom,
        dateTo,
      }),
    // Staff GET is auto-scoped server-side; allow fetch even if profile id is pending
    enabled: !!businessId,
    staleTime: 60_000,
  });
}
