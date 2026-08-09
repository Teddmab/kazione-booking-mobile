import { useMemo, useState } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApptBlock } from "@/components/staff/calendar/ApptBlock";
import { NowLine } from "@/components/staff/calendar/NowLine";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import {
  GRID_HOURS,
  GRID_START_HOUR,
  HOUR_PX,
  TIME_COL_W,
  TOTAL_PX,
  addDays,
  apptHeightPx,
  apptTopPx,
  isSameDay,
  resolveOverlaps,
  toIsoDateLocal,
} from "@/lib/staffCalendar";
import type { StaffWorkingDay } from "@/services/staff/profile";
import type { StaffAppointment } from "@/services/staff/appointments";

interface Props {
  weekStart: Date;
  appointments: StaffAppointment[];
  workingDays?: StaffWorkingDay[];
  onSelect: (a: StaffAppointment) => void;
}

const HOURS = Array.from({ length: GRID_HOURS }, (_, i) => GRID_START_HOUR + i);

export function WeeklyCalendar({
  weekStart,
  appointments,
  workingDays = [],
  onSelect,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [colWidth, setColWidth] = useState(0);
  const today = new Date();

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, i);
        return { date: d, iso: toIsoDateLocal(d), index: i };
      }),
    [weekStart],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, StaffAppointment[]>();
    for (const day of days) map.set(day.iso, []);
    for (const appt of appointments) {
      const iso = toIsoDateLocal(new Date(appt.starts_at));
      if (map.has(iso)) map.get(iso)!.push(appt);
    }
    return map;
  }, [appointments, days]);

  const onDayLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - colWidth) > 1) setColWidth(w);
  };

  return (
    <View style={styles.root}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={{ width: TIME_COL_W }} />
        {days.map((day) => {
          const isToday = isSameDay(day.date, today);
          return (
            <View key={day.iso} style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
              <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                {day.date.toLocaleDateString(undefined, { weekday: "short" })}
              </Text>
              <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                {day.date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ height: TOTAL_PX }}>
        <View style={styles.body}>
          {/* Time labels */}
          <View style={[styles.timeCol, { width: TIME_COL_W }]}>
            {HOURS.map((h) => (
              <View key={h} style={[styles.timeSlot, { height: HOUR_PX }]}>
                <Text style={styles.timeLabel}>
                  {String(h).padStart(2, "0")}:00
                </Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {days.map((day) => {
            const dayAppts = byDay.get(day.iso) ?? [];
            const overlaps = resolveOverlaps(dayAppts);
            const dow = day.date.getDay();
            const wh = workingDays.find((w) => w.day === dow);
            const isOff = wh ? !wh.is_working : false;
            const isToday = isSameDay(day.date, today);

            return (
              <View
                key={day.iso}
                style={[styles.dayCol, isToday && styles.dayColToday]}
                onLayout={onDayLayout}>
                {HOURS.map((h) => (
                  <View
                    key={h}
                    style={[styles.hourLine, { top: (h - GRID_START_HOUR) * HOUR_PX }]}
                  />
                ))}
                {isOff ? <View style={styles.offOverlay} pointerEvents="none" /> : null}
                {isToday ? <NowLine /> : null}
                {colWidth > 0 &&
                  dayAppts.map((appt) => {
                    const layout = overlaps.get(appt.id);
                    return (
                      <ApptBlock
                        key={appt.id}
                        appt={appt}
                        top={apptTopPx(appt.starts_at)}
                        height={apptHeightPx(appt.starts_at, appt.ends_at)}
                        colOffset={layout?.colOffset ?? 0}
                        colCount={layout?.colCount ?? 1}
                        colWidth={colWidth}
                        onPress={onSelect}
                      />
                    );
                  })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    headerRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 6,
      paddingTop: 4,
      paddingHorizontal: 4,
    },
    dayHeader: { flex: 1, alignItems: "center" },
    dayHeaderToday: {},
    dayName: {
      fontSize: 11,
      color: colors.textDim,
      fontWeight: "500",
      fontFamily: ownerFonts.medium,
    },
    dayNameToday: {
      color: colors.primary,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
    dayNum: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginTop: 2,
      fontFamily: ownerFonts.semiBold,
    },
    dayNumToday: {
      color: "#fff",
      backgroundColor: colors.primary,
      overflow: "hidden",
      width: 24,
      height: 24,
      borderRadius: 12,
      textAlign: "center",
      lineHeight: 24,
      fontFamily: ownerFonts.bold,
    },
    scroll: { flex: 1 },
    body: { flexDirection: "row", height: TOTAL_PX },
    timeCol: {},
    timeSlot: { justifyContent: "flex-start" },
    timeLabel: {
      fontSize: 10,
      color: colors.textDim,
      marginTop: -6,
      fontFamily: ownerFonts.regular,
    },
    dayCol: {
      flex: 1,
      position: "relative",
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
    },
    dayColToday: { backgroundColor: colors.primarySurface },
    hourLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    offOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.textDim + "1F",
    },
  });
}
