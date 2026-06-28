import { useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { StaffAppointmentCard } from "@/components/StaffAppointmentCard";
import { ownerColors } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useStaffAppointments } from "@/hooks/useStaffAppointments";

export default function StaffHomeScreen() {
  const router = useRouter();
  const { signOut } = useAuthContext();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const position = tenant?.position ?? null;

  const {
    appointments,
    totalEarned,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useStaffAppointments(businessId);

  const handleSignOut = () => {
    void signOut().then(() => router.replace("/(auth)/login" as Href));
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>My Appointments</Text>
          {position ? <Text style={styles.position}>{position}</Text> : null}
        </View>
        <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      {/* Earnings summary */}
      {appointments.length > 0 && (
        <View style={styles.earningsBanner}>
          <Text style={styles.earningsLabel}>Total earnings this view</Text>
          <Text style={styles.earningsValue}>EUR {totalEarned.toFixed(2)}</Text>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ownerColors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load appointments</Text>
          <Pressable style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <StaffAppointmentCard appointment={item} />}
          contentContainerStyle={styles.list}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={ownerColors.primary} style={{ marginVertical: 12 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No appointments yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ownerColors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: ownerColors.border,
  },
  greeting: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  position: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  signOutBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  signOutText: { fontSize: 13, color: ownerColors.textMuted },
  earningsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: ownerColors.primaryMuted,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ownerColors.border,
  },
  earningsLabel: { fontSize: 13, color: ownerColors.primary },
  earningsValue: { fontSize: 16, fontWeight: "700", color: ownerColors.primary },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 15, color: ownerColors.textMuted },
  retryBtn: {
    backgroundColor: ownerColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  empty: { paddingVertical: 48, alignItems: "center" },
  emptyText: { fontSize: 15, color: ownerColors.textMuted },
});
