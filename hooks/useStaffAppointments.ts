import { useInfiniteQuery } from "@tanstack/react-query";

import { getAppointments } from "@/services/owner/appointments";
import type { AppointmentWithRelations } from "@/types/owner";

export interface UseStaffAppointmentsResult {
  appointments: AppointmentWithRelations[];
  totalEarned: number;
  isLoading: boolean;
  isError: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => void;
}

export function useStaffAppointments(businessId: string): UseStaffAppointmentsResult {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["staff-appointments", businessId],
    queryFn: ({ pageParam = 1 }) =>
      getAppointments(businessId, { page: pageParam as number, limit: 20 }),
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((acc, p) => acc + p.appointments.length, 0);
      return fetched < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!businessId,
    staleTime: 30_000,
  });

  const appointments = data?.pages.flatMap((p) => p.appointments) ?? [];
  const totalEarned = appointments.reduce(
    (sum, a) => sum + (a.commission_earned ?? 0),
    0,
  );

  return {
    appointments,
    totalEarned,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    refetch,
  };
}
