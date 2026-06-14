import { useMemo, useState } from "react";

import { useOwnerAppointments } from "@/hooks/useOwnerAppointments";
import {
  endOfWeekSunday,
  groupAppointmentsByWeekDay,
  startOfWeekMonday,
  toIsoDateLocal,
} from "@/lib/ownerCalendar";
import type { AppointmentWithRelations } from "@/types/owner";

export function useOwnerCalendar(businessId: string, staffId?: string) {
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeekMonday(new Date()));

  const weekStart = useMemo(() => startOfWeekMonday(weekAnchor), [weekAnchor]);
  const weekEnd = useMemo(() => endOfWeekSunday(weekStart), [weekStart]);

  const filters = useMemo(
    () => ({
      dateFrom: toIsoDateLocal(weekStart),
      dateTo: toIsoDateLocal(weekEnd),
      limit: 200,
      ...(staffId ? { staffId } : {}),
    }),
    [weekStart, weekEnd, staffId],
  );

  const query = useOwnerAppointments(businessId, filters);

  const byDay = useMemo(
    () => groupAppointmentsByWeekDay(query.data?.appointments ?? [], weekStart),
    [query.data?.appointments, weekStart],
  );

  const goPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };

  const goNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };

  const goToday = () => setWeekAnchor(startOfWeekMonday(new Date()));

  return {
    weekStart,
    weekEnd,
    byDay,
    appointments: query.data?.appointments ?? [] as AppointmentWithRelations[],
    goPrevWeek,
    goNextWeek,
    goToday,
    ...query,
  };
}
