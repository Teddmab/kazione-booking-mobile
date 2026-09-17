import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { fmtDateRangeLabel, shortDayLabel, type CapacityDay } from "@/lib/ownerDashboardLayout";

export function OwnerCapacityPanel({
  days,
  locale,
}: {
  days: CapacityDay[];
  locale: string;
}) {
  const { t } = useTranslation();
  const rangeLabel =
    days.length > 0 ? fmtDateRangeLabel(days[0].date, days[days.length - 1].date, locale) : "";
  const maxAvailableH = Math.max(1, ...days.map((d) => Math.round(d.availableMinutes / 60)));
  const empty = days.every((d) => d.availableMinutes === 0);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{t("owner.dashCapacity")}</Text>
        {!empty ? (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: ownerColors.primary }]} />
              <Text style={styles.legendText}>{t("owner.dashBooked")}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: ownerColors.border }]} />
              <Text style={styles.legendText}>{t("owner.dashCap")}</Text>
            </View>
          </View>
        ) : null}
      </View>
      <Text style={styles.range}>{rangeLabel}</Text>
      {empty ? (
        <Text style={styles.empty}>{t("owner.dashCapacityEmpty")}</Text>
      ) : (
        days.map((d) => {
          const bookedH = Math.round(d.bookedMinutes / 60);
          const availH = Math.round(d.availableMinutes / 60);
          const barPct = Math.min(100, Math.round((availH / maxAvailableH) * 100));
          const bookedOfBar = availH > 0 ? Math.min(100, Math.round((bookedH / availH) * 100)) : 0;
          return (
            <View key={d.date} style={styles.row}>
              <Text style={styles.day}>{shortDayLabel(d.date, locale)}</Text>
              <View style={styles.track}>
                <View style={[styles.avail, { width: `${barPct}%` }]} />
                <View
                  style={[
                    styles.booked,
                    { width: `${(barPct * bookedOfBar) / 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.hours}>
                {availH > 0 ? `${bookedH} / ${availH}h` : t("owner.dashClosed")}
              </Text>
            </View>
          );
        })
      )}
      <Text style={styles.helper}>{t("owner.dashCapacityHelper")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  title: { fontFamily: ownerFonts.semiBold, fontSize: 14, color: ownerColors.text, flex: 1 },
  legend: { flexDirection: "row", gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: ownerColors.textMuted },
  range: { fontSize: 12, color: ownerColors.textMuted, marginBottom: 12, marginTop: 2 },
  empty: { fontSize: 13, color: ownerColors.textMuted, paddingVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  day: { width: 72, fontSize: 12, fontFamily: ownerFonts.medium, color: ownerColors.text },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: ownerColors.primarySurface,
    overflow: "hidden",
    position: "relative",
  },
  avail: {
    height: "100%",
    backgroundColor: "rgba(155, 123, 114, 0.18)",
    borderRadius: 999,
  },
  booked: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: ownerColors.primary,
    borderRadius: 999,
  },
  hours: { width: 58, textAlign: "right", fontSize: 12, fontFamily: ownerFonts.medium, color: ownerColors.text },
  helper: { fontSize: 11, color: ownerColors.textMuted, marginTop: 6 },
});
