import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import type { ProductRow } from "@/types/products";

interface Props {
  product: ProductRow;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: Props) {
  const isOut = product.current_stock <= 0;
  const isLow = !isOut && product.is_low_stock;

  const badgeColor = isOut ? ownerColors.danger : isLow ? ownerColors.warning : ownerColors.success;
  const badgeBg = isOut ? ownerColors.dangerMuted : isLow ? ownerColors.warningMuted : ownerColors.successMuted;
  const badgeLabel = isOut ? "Out of stock" : isLow ? "Low stock" : "In stock";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.name}>{product.name}</Text>
        {product.category ? <Text style={styles.meta}>{product.category}</Text> : null}
        {product.supplier_name ? <Text style={styles.meta}>{product.supplier_name}</Text> : null}
      </View>
      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
        <Text style={[styles.stock, isOut ? styles.stockDanger : isLow ? styles.stockWarn : styles.stockOk]}>
          {Number(product.current_stock).toLocaleString()} {product.unit}
        </Text>
        {product.min_stock_alert != null && (
          <Text style={styles.minStock}>min {product.min_stock_alert}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 8,
  },
  left: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  meta: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  stock: { fontSize: 15, fontWeight: "700" },
  stockOk: { color: ownerColors.success },
  stockWarn: { color: ownerColors.warning },
  stockDanger: { color: ownerColors.danger },
  minStock: { fontSize: 11, color: ownerColors.textDim },
});
