import { View, Text, StyleSheet } from "react-native";

/** Phase 3 — wire `useCustomerBookings` + detail (same API as web). */
export default function ClientBookingsPlaceholder() {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>My bookings</Text>
      <Text style={styles.body}>
        Your upcoming and past appointments will appear here (Phase 3 in docs/MOBILE_ROADMAP.md).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, padding: 24, backgroundColor: "#fff", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 22, color: "#555" },
});
