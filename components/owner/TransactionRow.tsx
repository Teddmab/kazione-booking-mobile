import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ownerColors } from "@/constants/ownerTheme";
import { clientDisplayName, formatCurrency, formatDate, formatTime } from "@/lib/format";
import type { AppointmentWithRelations } from "@/types/owner";

type Props = {
  item: AppointmentWithRelations;
};

function statusStyle(status: string) {
  if (status === "completed") return styles.badgeCompleted;
  if (status === "cancelled") return styles.badgeCancelled;
  if (status === "refunded") return styles.badgeRefunded;
  return styles.badgeDefault;
}

function paymentLabel(method: string | undefined, t: (k: string) => string) {
  if (!method) return t("owner.paymentAtSalon");
  if (method === "card" || method === "stripe") return t("owner.paymentCard");
  if (method === "mobile_money") return t("owner.paymentMobile");
  if (method === "later" || method === "at_salon") return t("owner.paymentAtSalon");
  return method;
}

export function TransactionRow({ item }: Props) {
  const { t } = useTranslation();
  const clientName = clientDisplayName(item.client.first_name, item.client.last_name);
  const staffName = item.staff?.display_name ?? "—";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.date}>
          {formatDate(item.starts_at)} · {formatTime(item.starts_at)}
        </Text>
        <Text style={styles.amount}>{formatCurrency(item.price)}</Text>
      </View>
      <Text style={styles.client}>{clientName}</Text>
      <Text style={styles.meta}>
        {item.service.name} · {staffName}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.payment}>
          {paymentLabel(item.payment?.method, t)}
        </Text>
        <View style={[styles.badge, statusStyle(item.status)]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  date: { fontSize: 12, color: ownerColors.textDim },
  amount: { fontSize: 15, fontWeight: "700", color: ownerColors.text },
  client: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  meta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  payment: { fontSize: 12, color: ownerColors.textDim },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  badgeCompleted: { backgroundColor: "rgba(46, 125, 50, 0.12)" },
  badgeCancelled: { backgroundColor: "rgba(176, 0, 32, 0.12)" },
  badgeRefunded: { backgroundColor: "rgba(255, 152, 0, 0.12)" },
  badgeDefault: { backgroundColor: ownerColors.primaryMuted },
});
