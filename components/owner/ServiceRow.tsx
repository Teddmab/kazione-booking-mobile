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
  const inactive = !item.is_active;

  return (
    <Pressable
      style={[styles.card, inactive && styles.cardInactive]}
      onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.thumbWrap, inactive && styles.thumbInactive]}>
          <SafeImage uri={item.image_url} style={styles.thumb} fallbackLetter={initial} />
          {inactive ? (
            <View style={styles.thumbOverlay}>
              <Ionicons name="archive-outline" size={16} color="#fff" />
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, inactive && styles.textInactive]} numberOfLines={2}>
              {item.name}
            </Text>
            {inactive ? (
              <View style={styles.archivedBadge}>
                <Text style={styles.archivedBadgeText}>Archivé</Text>
              </View>
            ) : onArchive ? (
              <Pressable
                style={styles.iconBtn}
                onPress={onArchive}
                accessibilityLabel="Archiver le service">
                <Ionicons name="archive-outline" size={18} color={ownerColors.textMuted} />
              </Pressable>
            ) : null}
            {inactive && onRestore ? (
              <Pressable style={styles.restoreBtn} onPress={onRestore}>
                <Text style={styles.restoreBtnText}>Restaurer</Text>
              </Pressable>
            ) : null}
          </View>

          {item.category_name ? (
            <Text style={[styles.category, inactive && styles.categoryInactive]}>
              {item.category_name}
            </Text>
          ) : null}

          <View style={styles.chips}>
            <View style={[styles.chip, inactive && styles.chipInactive]}>
              <Text style={[styles.chipText, inactive && styles.chipTextInactive]}>
                {item.duration_minutes} min
              </Text>
            </View>
            {buffer > 0 ? (
              <View style={[styles.chip, styles.chipMuted, inactive && styles.chipInactive]}>
                <Text style={[styles.chipTextMuted, inactive && styles.chipTextInactive]}>
                  {buffer} min buffer
                </Text>
              </View>
            ) : null}
            <View style={[styles.chip, inactive && styles.chipInactive]}>
              <Text style={[styles.chipText, inactive && styles.chipTextInactive]}>
                {formatCurrency(item.price, item.currency_code)}
              </Text>
            </View>
            {deposit > 0 ? (
              <View style={[styles.chip, styles.chipDeposit, inactive && styles.chipInactive]}>
                <Text style={[styles.chipDepositText, inactive && styles.chipTextInactive]}>
                  {formatCurrency(deposit, item.currency_code)} dépôt
                </Text>
              </View>
            ) : null}
          </View>

          {item.description ? (
            <Text style={[styles.desc, inactive && styles.textInactive]} numberOfLines={2}>
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
  cardInactive: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    opacity: 0.92,
  },
  row: { flexDirection: "row", gap: 12 },
  thumbWrap: { position: "relative" },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: ownerColors.bg },
  thumbInactive: { opacity: 0.55 },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: "rgba(55, 65, 81, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text, flex: 1 },
  textInactive: { color: ownerColors.textDim },
  archivedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  archivedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  category: {
    fontSize: 12,
    color: ownerColors.primary,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
  },
  categoryInactive: { color: ownerColors.textDim },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: ownerColors.bg,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  chipInactive: {
    backgroundColor: "#E5E7EB",
    borderColor: "#D1D5DB",
  },
  chipMuted: { backgroundColor: "#f5f5f5" },
  chipDeposit: { backgroundColor: "#e8f5e9", borderColor: "#c8e6c9" },
  chipText: { fontSize: 11, fontWeight: "600", color: ownerColors.textMuted },
  chipTextMuted: { fontSize: 11, fontWeight: "600", color: ownerColors.textDim },
  chipTextInactive: { color: "#9CA3AF" },
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
    backgroundColor: ownerColors.card,
  },
  restoreBtnText: { fontSize: 12, fontWeight: "600", color: ownerColors.primary },
});
