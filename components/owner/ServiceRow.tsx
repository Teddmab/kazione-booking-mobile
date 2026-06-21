import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SafeImage } from "@/components/SafeImage";
import { ownerColors } from "@/constants/ownerTheme";
import { formatCurrency } from "@/lib/format";
import type { OwnerServiceRow } from "@/types/owner";

interface Props {
  item: OwnerServiceRow;
  onPress: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

export function ServiceRow({ item, onPress, onArchive, onRestore }: Props) {
  const initial = item.name.trim().charAt(0).toUpperCase() || "?";
  const buffer = item.buffer_minutes ?? 0;
  const deposit = item.deposit_amount ?? 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <SafeImage uri={item.image_url} style={styles.thumb} fallbackLetter={initial} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            {item.is_active && onArchive ? (
              <Pressable
                style={styles.iconBtn}
                onPress={onArchive}
                accessibilityLabel="Archiver le service">
                <Ionicons name="archive-outline" size={18} color={ownerColors.textMuted} />
              </Pressable>
            ) : null}
            {!item.is_active && onRestore ? (
              <Pressable style={styles.restoreBtn} onPress={onRestore}>
                <Text style={styles.restoreBtnText}>Restaurer</Text>
              </Pressable>
            ) : null}
          </View>

          {item.category_name ? (
            <Text style={styles.category}>{item.category_name}</Text>
          ) : null}

          <View style={styles.chips}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.duration_minutes} min</Text>
            </View>
            {buffer > 0 ? (
              <View style={[styles.chip, styles.chipMuted]}>
                <Text style={styles.chipTextMuted}>{buffer} min buffer</Text>
              </View>
            ) : null}
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {formatCurrency(item.price, item.currency_code)}
              </Text>
            </View>
            {deposit > 0 ? (
              <View style={[styles.chip, styles.chipDeposit]}>
                <Text style={styles.chipDepositText}>
                  {formatCurrency(deposit, item.currency_code)} dépôt
                </Text>
              </View>
            ) : null}
          </View>

          {item.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: ownerColors.bg },
  content: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text, flex: 1 },
  category: {
    fontSize: 12,
    color: ownerColors.primary,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: ownerColors.bg,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  chipMuted: { backgroundColor: "#f5f5f5" },
  chipDeposit: { backgroundColor: "#e8f5e9", borderColor: "#c8e6c9" },
  chipText: { fontSize: 11, fontWeight: "600", color: ownerColors.textMuted },
  chipTextMuted: { fontSize: 11, fontWeight: "600", color: ownerColors.textDim },
  chipDepositText: { fontSize: 11, fontWeight: "600", color: "#2e7d32" },
  desc: { fontSize: 13, color: ownerColors.textDim, marginTop: 8, lineHeight: 18 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  restoreBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.primary,
  },
  restoreBtnText: { fontSize: 12, fontWeight: "600", color: ownerColors.primary },
});
