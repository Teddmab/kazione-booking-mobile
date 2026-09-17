import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { shortDayLabel } from "@/lib/ownerDashboardLayout";
import { fmtBusinessTime } from "@/lib/ownerDashboardLayout";
import type { AppointmentWithRelations } from "@/types/owner";

const DAY_PREVIEW = 4;

export function OwnerScheduleSection({
  days,
  todayStr,
  locale,
  timezone,
  rangeLabel,
  onOpenCalendar,
  onOpenAppointments,
}: {
  days: { date: string; appts: AppointmentWithRelations[] }[];
  todayStr: string;
  locale: string;
  timezone: string;
  rangeLabel: string;
  onOpenCalendar: () => void;
  onOpenAppointments: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("owner.dashSchedule")} · {rangeLabel}
        </Text>
        <Pressable onPress={onOpenCalendar} hitSlop={8}>
          <Text style={styles.link}>{t("owner.dashViewWeekly")}</Text>
        </Pressable>
      </View>

      {days.map((day) => {
        const isToday = day.date === todayStr;
        return (
          <View key={day.date} style={styles.day}>
            <View style={styles.dayHead}>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {shortDayLabel(day.date, locale)}
              </Text>
              {isToday ? (
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>{t("owner.dashTodayBadge")}</Text>
                </View>
              ) : null}
              <Text style={styles.count}>
                {day.appts.length === 0
                  ? t("owner.dashNoAppointments")
                  : t("owner.dashApptCount", { count: day.appts.length })}
              </Text>
            </View>
            {day.appts.length > 0 ? (
              <View style={[styles.list, isToday && styles.listToday]}>
                {day.appts.slice(0, DAY_PREVIEW).map((a) => {
                  const client =
                    `${a.client.first_name} ${a.client.last_name}`.trim() ||
                    t("owner.walkInGuest");
                  return (
                    <Pressable
                      key={a.id}
                      style={styles.row}
                      onPress={onOpenAppointments}>
                      <Text style={styles.time}>{fmtBusinessTime(a.starts_at, timezone)}</Text>
                      <View style={styles.meta}>
                        <Text style={styles.client} numberOfLines={1}>
                          {client}
                        </Text>
                        <Text style={styles.sub} numberOfLines={1}>
                          {a.service.name}
                          {a.staff ? ` · ${a.staff.display_name}` : ` · ${t("owner.unassigned")}`}
                        </Text>
                      </View>
                      <StatusBadge status={a.status} startsAt={a.starts_at} endsAt={a.ends_at} live={false} />
                    </Pressable>
                  );
                })}
                {day.appts.length > DAY_PREVIEW ? (
                  <Pressable onPress={onOpenAppointments}>
                    <Text style={styles.more}>
                      {t("owner.weekMore", { count: day.appts.length - DAY_PREVIEW })}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontFamily: ownerFonts.semiBold,
    fontSize: 14,
    color: ownerColors.text,
  },
  link: { fontSize: 12, fontFamily: ownerFonts.medium, color: ownerColors.primary },
  day: { marginBottom: 14 },
  dayHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  dayLabel: {
    fontSize: 11,
    fontFamily: ownerFonts.semiBold,
    color: ownerColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dayLabelToday: { color: ownerColors.primary },
  todayPill: {
    backgroundColor: ownerColors.primary,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  todayPillText: { color: "#fff", fontSize: 9, fontFamily: ownerFonts.bold },
  count: { marginLeft: "auto", fontSize: 11, color: ownerColors.textMuted },
  list: { gap: 6 },
  listToday: {
    borderLeftWidth: 2,
    borderLeftColor: ownerColors.primary,
    paddingLeft: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  time: {
    width: 46,
    fontSize: 13,
    fontFamily: ownerFonts.semiBold,
    color: ownerColors.text,
  },
  meta: { flex: 1, minWidth: 0 },
  client: { fontSize: 13, fontFamily: ownerFonts.medium, color: ownerColors.text },
  sub: { fontSize: 11, color: ownerColors.textMuted, marginTop: 1 },
  more: { fontSize: 12, fontFamily: ownerFonts.medium, color: ownerColors.primary, paddingLeft: 4 },
});
