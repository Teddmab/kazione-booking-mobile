import { Pressable, StyleSheet, Text, View } from "react-native";

import { clientDisplayName, formatTime } from "@/lib/format";
import type { OverlapPair } from "@/lib/appointmentOverlaps";
import { ownerColors } from "@/constants/ownerTheme";

interface Props {
  overlaps: OverlapPair[];
  expanded: boolean;
  onToggle: () => void;
  onFix: (pair: OverlapPair) => void;
  onDismiss: (key: string) => void;
  compact?: boolean;
}

export function OverlapBanner({
  overlaps,
  expanded,
  onToggle,
  onFix,
  onDismiss,
  compact,
}: Props) {
  if (overlaps.length === 0) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Pressable style={styles.header} onPress={onToggle}>
        <Text style={[styles.headerText, compact && styles.headerTextCompact]}>
          ⚠️ {overlaps.length} conflit{overlaps.length > 1 ? "s" : ""}
          {!compact ? " sur les 7 prochains jours" : ""}
        </Text>
        <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>

      {expanded
        ? overlaps.map((pair) => (
            <View key={pair.key} style={styles.pair}>
              <Text style={styles.staffName}>{pair.staffName}</Text>
              <Text style={styles.line}>
                {formatTime(pair.a.starts_at)} ·{" "}
                {clientDisplayName(pair.a.client.first_name, pair.a.client.last_name)} ·{" "}
                {pair.a.service.name}
              </Text>
              <Text style={styles.line}>
                {formatTime(pair.b.starts_at)} ·{" "}
                {clientDisplayName(pair.b.client.first_name, pair.b.client.last_name)} ·{" "}
                {pair.b.service.name}
              </Text>
              <View style={styles.actions}>
                <Pressable style={styles.fixBtn} onPress={() => onFix(pair)}>
                  <Text style={styles.fixText}>Corriger</Text>
                </Pressable>
                <Pressable onPress={() => onDismiss(pair.key)}>
                  <Text style={styles.okLink}>Marquer OK</Text>
                </Pressable>
              </View>
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
    padding: 12,
  },
  wrapCompact: {
    marginHorizontal: 12,
    marginBottom: 2,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: { flex: 1, fontSize: 13, fontWeight: "600", color: "#92400E" },
  headerTextCompact: { fontSize: 12 },
  chevron: { fontSize: 12, color: "#92400E", marginLeft: 8 },
  pair: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F59E0B",
  },
  staffName: { fontSize: 14, fontWeight: "700", color: ownerColors.text, marginBottom: 4 },
  line: { fontSize: 12, color: "#78350F", marginTop: 2 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 10,
  },
  fixBtn: {
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFBEB",
  },
  fixText: { fontSize: 13, fontWeight: "600", color: "#B45309" },
  okLink: { fontSize: 13, color: ownerColors.textMuted, textDecorationLine: "underline" },
});
