import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { formatChartLabel } from "@/lib/financePeriod";
import type { IncomePeriod } from "@/types/finance";

type Props = {
  data: IncomePeriod[];
  language?: string;
};

export function RevenueBarChart({ data, language = "en" }: Props) {
  const { t } = useTranslation();
  const max = Math.max(...data.map((d) => d.amount), 1);
  const bars = data.slice(-14);

  if (bars.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t("owner.financeNoChartData")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.barsRow}>
        {bars.map((item) => {
          const heightPct = Math.max(8, (item.amount / max) * 100);
          return (
            <View key={item.period} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${heightPct}%` }]} />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {formatChartLabel(item.period, language)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 160,
    gap: 4,
  },
  barCol: { flex: 1, alignItems: "center", minWidth: 0 },
  barTrack: {
    width: "100%",
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  barFill: {
    width: "70%",
    minHeight: 4,
    borderRadius: 4,
    backgroundColor: ownerColors.primary,
  },
  barLabel: {
    fontSize: 9,
    color: ownerColors.textDim,
    marginTop: 6,
    textAlign: "center",
  },
  empty: {
    padding: 24,
    alignItems: "center",
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  emptyText: { color: ownerColors.textMuted, fontSize: 14 },
});
