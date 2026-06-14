import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import type { ProductRow } from "@/types/products";

interface Props {
  product: ProductRow;
  onPress?: () => void;
}

function stockBadge(product: ProductRow): { label: string; bg: string; color: string } {
  if (product.current_stock <= 0) {
    return { label: "Rupture", bg: "#FEE2E2", color: "#991B1B" };
  }
  if (product.is_low_stock) {
    return { label: "Stock bas", bg: "#FFF3CD", color: "#664D03" };
  }
  return { label: "En stock", bg: "#DCFCE7", color: "#166534" };
}

export function ProductCard({ product, onPress }: Props) {
  const badge = stockBadge(product);

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>
      {product.category ? (
        <Text style={styles.meta} numberOfLines={1}>
          {product.category}
        </Text>
      ) : null}
      <Text style={styles.stock}>
        {product.current_stock} {product.unit}
        {product.min_stock_alert != null ? ` · min ${product.min_stock_alert}` : ""}
      </Text>
      {product.supplier_name ? (
        <Text style={styles.meta} numberOfLines={1}>
          {product.supplier_name}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 12,
    marginBottom: 8,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: "600", color: ownerColors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  meta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  stock: { fontSize: 14, color: ownerColors.text, marginTop: 6, fontWeight: "500" },
});
