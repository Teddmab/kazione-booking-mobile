import { StyleSheet, Text, View } from "react-native";

import { DashboardPanel } from "@/components/owner/dashboard/DashboardPanel";
import { ownerColors } from "@/constants/ownerTheme";
import type { StorefrontPromotion } from "@/types/owner";

interface Props {
  promotions: StorefrontPromotion[];
}

function promoStatus(p: StorefrontPromotion): "active" | "upcoming" | "ended" {
  if (!p.is_active) return "ended";
  if (p.valid_until && new Date(p.valid_until) > new Date()) return "active";
  if (!p.valid_until) return "active";
  return "upcoming";
}

export function PromotionsCard({ promotions }: Props) {
  const list = Array.isArray(promotions) ? promotions : [];
  const active = list.filter((p) => promoStatus(p) === "active").length;
  const upcoming = list.filter((p) => promoStatus(p) === "upcoming").length;
  const visible = list.slice(0, 4);

  return (
    <DashboardPanel
      title="Promotions & Campaigns"
      subtitle={`${active} active · ${upcoming} upcoming`}
      icon="pricetag-outline">
      {visible.length === 0 ? (
        <Text style={styles.empty}>Aucune promotion active</Text>
      ) : (
        visible.map((p) => {
          const status = promoStatus(p);
          return (
            <View key={p.id} style={styles.row}>
              <View style={styles.meta}>
                <Text style={styles.name}>{p.title}</Text>
                <Text style={styles.sub} numberOfLines={2}>
                  {p.description ?? "—"}
                  {p.valid_until ? ` · jusqu'au ${p.valid_until.slice(0, 10)}` : " · En cours"}
                </Text>
              </View>
              <View style={[styles.badge, status === "active" ? styles.badgeActive : styles.badgeUpcoming]}>
                <Text style={[styles.badgeText, status === "active" ? styles.badgeTextActive : styles.badgeTextUpcoming]}>
                  {status}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </DashboardPanel>
  );
}

const styles = StyleSheet.create({
  empty: { padding: 16, fontSize: 14, color: ownerColors.textMuted },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ownerColors.border,
  },
  meta: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  sub: { fontSize: 12, color: ownerColors.textMuted, marginTop: 4, lineHeight: 18 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: ownerColors.successMuted },
  badgeUpcoming: { backgroundColor: "#e3f2fd" },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  badgeTextActive: { color: ownerColors.success },
  badgeTextUpcoming: { color: "#1565c0" },
});
