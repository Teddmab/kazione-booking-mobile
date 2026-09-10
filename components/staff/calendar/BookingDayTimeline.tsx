import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  BlockSlotCard,
  BookingApptCard,
  resolveVisualStatus,
} from "@/components/staff/calendar/BookingApptCard";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useLiveNow } from "@/hooks/useLiveNow";
import { zonedWallMinutes } from "@/lib/businessTime";
import { GRID_END_HOUR, GRID_START_HOUR } from "@/lib/staffCalendar";
import type { StaffAppointment } from "@/services/staff/appointments";

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
  timeZone: string,
): boolean {
  const start = hour * 60;
  const end = (hour + 1) * 60;
  return appts.some((a) => {
    const s = zonedWallMinutes(a.starts_at, timeZone);
    const e = zonedWallMinutes(a.ends_at, timeZone);
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
  const { tenant } = useTenantContext();
  const timeZone = tenant?.timezone ?? "Europe/Tallinn";
  const now = useLiveNow(15_000);
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
      const startMin = zonedWallMinutes(a.starts_at, timeZone);
      const endMin = zonedWallMinutes(a.ends_at, timeZone);
      if (endMin <= GRID_START_HOUR * 60 || startMin >= GRID_END_HOUR * 60) {
        continue;
      }
      const h = Math.min(
        GRID_END_HOUR - 1,
        Math.max(GRID_START_HOUR, Math.floor(startMin / 60)),
      );
      const arr = map.get(h) ?? [];
      arr.push(a);
      map.set(h, arr);
    }
    return map;
  }, [sorted, timeZone]);

  const freeBlockHours = useMemo(() => {
    const set = new Set<number>();
    if (sorted.length === 0) return set;

    const firstApptHour = Math.max(
      GRID_START_HOUR,
      Math.floor(zonedWallMinutes(sorted[0].starts_at, timeZone) / 60),
    );
    const lastApptEndHour = Math.min(
      GRID_END_HOUR,
      Math.ceil(zonedWallMinutes(sorted[sorted.length - 1].ends_at, timeZone) / 60),
    );

    let gapStart: number | null = null;
    for (const hour of hours) {
      if (hour < firstApptHour) {
        gapStart = null;
        continue;
      }
      if (hour >= lastApptEndHour + 1) {
        gapStart = null;
        continue;
      }

      const free = !hourCovered(hour, sorted, timeZone);
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
  }, [hours, sorted, timeZone]);

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
