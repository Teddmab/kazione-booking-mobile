import { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppointmentStatusSheet } from "@/components/staff/AppointmentStatusSheet";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { WeekNav } from "@/components/staff/calendar/WeekNav";
import { WeeklyCalendar } from "@/components/staff/calendar/WeeklyCalendar";
import { ownerStyles } from "@/constants/ownerTheme";
import { useStaffAppointments } from "@/hooks/useStaffAppointments";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { addDays, startOfWeekMonday, toIsoDateLocal } from "@/lib/staffCalendar";
import type { StaffAppointment } from "@/services/staff/appointments";

const WEEK_KEY = "staff_calendar_week_start";

export default function StaffCalendarScreen() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [selected, setSelected] = useState<StaffAppointment | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(WEEK_KEY).then((raw) => {
      if (raw) {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) setWeekStart(startOfWeekMonday(d));
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(WEEK_KEY, weekStart.toISOString());
  }, [weekStart, hydrated]);

  const weekEnd = addDays(weekStart, 6);
  const { data: appointments = [] } = useStaffAppointments(
    toIsoDateLocal(weekStart),
    toIsoDateLocal(weekEnd),
  );
  const { data: staffSelf } = useStaffSelf();

  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar
        title="Agenda"
        subtitle="Vue hebdomadaire"
        displayTitle
        bottomSlot={
          <WeekNav
            weekStart={weekStart}
            onPrev={() => setWeekStart((d) => addDays(d, -7))}
            onNext={() => setWeekStart((d) => addDays(d, 7))}
            onToday={() => setWeekStart(startOfWeekMonday(new Date()))}
          />
        }
      />
      <WeeklyCalendar
        weekStart={weekStart}
        appointments={appointments}
        workingDays={staffSelf?.working_hours ?? []}
        onSelect={setSelected}
      />
      <AppointmentStatusSheet
        appointment={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}
