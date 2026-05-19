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
    status === "confirmed" || status === "completed"
      ? "success"
      : status === "cancelled" || status === "no_show"
        ? "danger"
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
    borderWidth: 1,
  },
  neutral: { backgroundColor: "#f5f0eb", borderColor: "#e8e0d8" },
  success: { backgroundColor: "#e8f5e9", borderColor: "#c8e6c9" },
  danger: { backgroundColor: "#ffebee", borderColor: "#ffcdd2" },
  text: { fontSize: 12, fontWeight: "600" },
  neutralText: { color: "#555" },
  successText: { color: "#2e7d32" },
  dangerText: { color: "#b00020" },
});
