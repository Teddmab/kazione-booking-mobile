import { Text, View, StyleSheet } from "react-native";

const STATUS_FR: Record<string, string> = {
  pending: "En attente",
  pending_payment: "Paiement",
  confirmed: "Confirmé",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
};

type Props = { status: string };

export function StatusBadge({ status }: Props) {
  const label = STATUS_FR[status] ?? status;
  const variant =
    status === "confirmed"
      ? "confirmed"
      : status === "completed"
        ? "completed"
        : status === "cancelled" || status === "no_show"
          ? "cancelled"
          : status === "pending" || status === "pending_payment"
            ? "pending"
            : "neutral";

  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confirmed: { backgroundColor: "#DCFCE7" },
  pending: { backgroundColor: "#FEF9C3" },
  cancelled: { backgroundColor: "#FEE2E2" },
  completed: { backgroundColor: "#F0DDD8" },
  neutral: { backgroundColor: "#F5F5F5" },
  text: { fontSize: 12, fontWeight: "600" },
  confirmedText: { color: "#166534" },
  pendingText: { color: "#854D0E" },
  cancelledText: { color: "#991B1B" },
  completedText: { color: "#6B4C42" },
  neutralText: { color: "#6B4C42" },
});
