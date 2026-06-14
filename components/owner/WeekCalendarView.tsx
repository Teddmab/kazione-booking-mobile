import { Pressable, ScrollView, Text, View, StyleSheet } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import {
  APPOINTMENT_BLOCK_COLORS,
  blockHeightPx,
  blockTopPx,
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_HEIGHT,
  CALENDAR_HOUR_START,
  currentTimeLineTopPx,
  isTodayInWeek,
  weekDayLabels,
} from "@/lib/ownerCalendar";
import { clientDisplayName, formatTime } from "@/lib/format";
import type { AppointmentWithRelations } from "@/types/owner";

const HOUR_LABELS = Array.from(
  { length: CALENDAR_HOUR_END - CALENDAR_HOUR_START },
  (_, i) => CALENDAR_HOUR_START + i,
);

interface Props {
  weekStart: Date;
  byDay: Map<number, AppointmentWithRelations[]>;
  onSelect: (appt: AppointmentWithRelations) => void;
}

export function WeekCalendarView({ weekStart, byDay, onSelect }: Props) {
  const days = weekDayLabels(weekStart);
  const gridHeight = (CALENDAR_HOUR_END - CALENDAR_HOUR_START) * CALENDAR_HOUR_HEIGHT;
  const nowLine = isTodayInWeek(weekStart) ? currentTimeLineTopPx() : null;
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
      <View style={styles.calendarRoot}>
        <View style={styles.dayHeaderRow}>
          <View style={styles.timeGutter} />
          {days.map((d) => (
            <View
              key={d.iso}
              style={[styles.dayHeader, d.iso === todayIso && styles.dayHeaderToday]}>
              <Text style={[styles.dayHeaderText, d.iso === todayIso && styles.dayHeaderTodayText]}>
                {d.label}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView style={styles.vScroll} nestedScrollEnabled>
          <View style={styles.gridRow}>
            <View style={[styles.timeGutter, { height: gridHeight }]}>
              {HOUR_LABELS.map((h) => (
                <View key={h} style={{ height: CALENDAR_HOUR_HEIGHT }}>
                  <Text style={styles.hourLabel}>{h}:00</Text>
                </View>
              ))}
            </View>

            {days.map((d) => (
              <View key={d.iso} style={[styles.dayCol, { height: gridHeight }]}>
                {HOUR_LABELS.map((h) => (
                  <View
                    key={h}
                    style={[styles.hourCell, { height: CALENDAR_HOUR_HEIGHT }]}
                  />
                ))}
                {(byDay.get(d.index) ?? []).map((appt) => {
                  const top = blockTopPx(appt.starts_at);
                  if (top < 0 || top > gridHeight) return null;
                  const colors =
                    APPOINTMENT_BLOCK_COLORS[appt.status] ??
                    APPOINTMENT_BLOCK_COLORS.pending;
                  const name = clientDisplayName(
                    appt.client.first_name,
                    appt.client.last_name,
                  );
                  return (
                    <Pressable
                      key={appt.id}
                      style={[
                        styles.block,
                        {
                          top,
                          height: blockHeightPx(appt.duration_minutes),
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => onSelect(appt)}>
                      <Text style={styles.blockTime} numberOfLines={1}>
                        {formatTime(appt.starts_at)}
                      </Text>
                      <Text style={styles.blockName} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={styles.blockService} numberOfLines={1}>
                        {appt.service.name}
                      </Text>
                    </Pressable>
                  );
                })}
                {d.iso === todayIso && nowLine != null ? (
                  <View style={[styles.nowLine, { top: nowLine }]} />
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const DAY_WIDTH = 92;

const styles = StyleSheet.create({
  hScroll: { flex: 1, minHeight: 0 },
  calendarRoot: { flex: 1, minHeight: 0 },
  vScroll: { flex: 1, minHeight: 0 },
  dayHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: ownerColors.border },
  timeGutter: { width: 44 },
  dayHeader: {
    width: DAY_WIDTH,
    paddingVertical: 8,
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: ownerColors.border,
  },
  dayHeaderToday: { backgroundColor: ownerColors.primaryMuted },
  dayHeaderText: { fontSize: 11, fontWeight: "600", color: ownerColors.textMuted },
  dayHeaderTodayText: { color: ownerColors.primary },
  gridRow: { flexDirection: "row" },
  hourLabel: { fontSize: 10, color: ownerColors.textDim, paddingTop: 2 },
  dayCol: {
    width: DAY_WIDTH,
    position: "relative",
    borderLeftWidth: 1,
    borderLeftColor: ownerColors.border,
  },
  hourCell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ownerColors.border,
  },
  block: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 6,
    borderWidth: 1,
    padding: 4,
    overflow: "hidden",
  },
  blockTime: { fontSize: 9, fontWeight: "700", color: ownerColors.text },
  blockName: { fontSize: 10, fontWeight: "600", color: ownerColors.text },
  blockService: { fontSize: 9, color: ownerColors.textMuted },
  nowLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ownerColors.danger,
    zIndex: 2,
  },
});
