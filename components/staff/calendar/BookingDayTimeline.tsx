import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  BlockSlotCard,
  BookingApptCard,
  resolveVisualStatus,
} from "@/components/staff/calendar/BookingApptCard";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { GRID_END_HOUR, GRID_START_HOUR } from "@/lib/staffCalendar";
import type { StaffAppointment } from "@/services/staff/appointments";

function wallMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function labelHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

function findConflicts(appts: StaffAppointment[]): Set<string> {
  const ids = new Set<string>();
  const sorted = [...appts].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (new Date(b.starts_at).getTime() >= new Date(a.ends_at).getTime()) break;
      ids.add(a.id);
      ids.add(b.id);
    }
  }
  return ids;
}

function hourCovered(
  hour: number,
  appts: StaffAppointment[],
): boolean {
  const start = hour * 60;
  const end = (hour + 1) * 60;
  return appts.some((a) => {
    const s = wallMinutes(a.starts_at);
    const e = wallMinutes(a.ends_at);
    return s < end && e > start;
  });
}

interface Props {
  appointments: StaffAppointment[];
  onPressAppt: (a: StaffAppointment) => void;
  onBlockGap: (startTime: string, endTime: string) => void;
}

export function BookingDayTimeline({
  appointments,
  onPressAppt,
  onBlockGap,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const now = useMemo(() => new Date(), []);
  const conflictIds = useMemo(() => findConflicts(appointments), [appointments]);

  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      ),
    [appointments],
  );

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) list.push(h);
    return list;
  }, []);

  const apptsByHour = useMemo(() => {
    const map = new Map<number, StaffAppointment[]>();
    for (const a of sorted) {
      const h = Math.floor(wallMinutes(a.starts_at) / 60);
      if (h < GRID_START_HOUR || h >= GRID_END_HOUR) continue;
      const arr = map.get(h) ?? [];
      arr.push(a);
      map.set(h, arr);
    }
    return map;
  }, [sorted]);

  const freeBlockHours = useMemo(() => {
    const set = new Set<number>();
    let gapStart: number | null = null;
    for (const hour of hours) {
      const free = !hourCovered(hour, sorted);
      if (free) {
        if (gapStart == null) {
          gapStart = hour;
          set.add(hour);
        }
      } else {
        gapStart = null;
      }
    }
    return set;
  }, [hours, sorted]);

  return (
    <View style={styles.timeline}>
      {hours.map((hour) => {
        const starts = apptsByHour.get(hour) ?? [];
        const showBlock = starts.length === 0 && freeBlockHours.has(hour);

        return (
          <View key={hour} style={styles.hourRow}>
            <Text style={styles.hourLabel}>{labelHour(hour)}</Text>
            <View style={styles.hourContent}>
              <View style={styles.hourLine} />
              {starts.map((a) => {
                const visual = resolveVisualStatus(
                  a,
                  now,
                  conflictIds.has(a.id),
                );
                return (
                  <BookingApptCard
                    key={a.id}
                    appointment={a}
                    visualStatus={visual}
                    onPress={() => onPressAppt(a)}
                    onResolveConflict={
                      conflictIds.has(a.id)
                        ? () => onPressAppt(a)
                        : undefined
                    }
                  />
                );
              })}
              {showBlock ? (
                <BlockSlotCard
                  startLabel={labelHour(hour)}
                  endLabel={labelHour(hour + 1)}
                  onPress={() =>
                    onBlockGap(labelHour(hour), labelHour(hour + 1))
                  }
                />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    timeline: { gap: 0, paddingBottom: 8 },
    hourRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      minHeight: 44,
      paddingBottom: 6,
    },
    hourLabel: {
      width: 40,
      paddingTop: 2,
      fontSize: 11,
      fontWeight: "600",
      color: colors.textDim,
      fontFamily: ownerFonts.semiBold,
    },
    hourContent: {
      flex: 1,
      gap: 6,
      paddingTop: 0,
    },
    hourLine: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderStyle: "dashed",
      marginBottom: 4,
    },
  });
}
