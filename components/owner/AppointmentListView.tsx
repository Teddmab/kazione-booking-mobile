import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors } from "@/constants/ownerTheme";
import {
  type AppointmentFlag,
  flagBorderColor,
  flagLabel,
} from "@/lib/appointmentFlags";
import {
  clientDisplayName,
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/format";
import type { AppointmentWithRelations } from "@/types/owner";

interface Props {
  appointments: AppointmentWithRelations[];
  flags?: Map<string, AppointmentFlag>;
  isRefetching: boolean;
  onRefresh: () => void;
  onSelect: (appt: AppointmentWithRelations) => void;
}

export function AppointmentListView({
  appointments,
  flags,
  isRefetching,
  onRefresh,
  onSelect,
}: Props) {
  return (
    <FlatList
      data={appointments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => {
        const name = clientDisplayName(item.client.first_name, item.client.last_name);
        const flag = flags?.get(item.id);
        return (
          <Pressable
            style={[
              styles.card,
              flag === "test" && styles.cardTest,
              flag === "duplicate" && {
                borderColor: flagBorderColor("duplicate"),
                backgroundColor: "#FFFBEB",
              },
              flag === "close_interval" && {
                borderColor: flagBorderColor("close_interval"),
                backgroundColor: "#FFF7ED",
              },
            ]}
            onPress={() => onSelect(item)}>
            <View style={styles.rowTop}>
              <Text style={styles.time}>{formatTime(item.starts_at)}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.date}>{formatDate(item.starts_at)}</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {flag ? (
                <Text
                  style={[
                    styles.flagBadge,
                    flag === "test" && styles.flagTest,
                    flag === "duplicate" && styles.flagDuplicate,
                    flag === "close_interval" && styles.flagClose,
                  ]}>
                  {flagLabel(flag)}
                </Text>
              ) : null}
            </View>
            <Text style={styles.meta}>
              {item.service.name} · {item.staff?.display_name ?? "Sans préférence"}
            </Text>
            <Text style={styles.ref}>
              {item.booking_reference} · {formatCurrency(item.price)}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTest: { opacity: 0.5, backgroundColor: "#F3F4F6" },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: { fontSize: 16, fontWeight: "700", color: ownerColors.primary },
  date: { fontSize: 12, color: ownerColors.textDim, marginTop: 2, marginBottom: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  flagBadge: {
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  flagTest: { backgroundColor: "#E5E7EB", color: "#6B7280" },
  flagDuplicate: { backgroundColor: "#FEF3C7", color: "#B45309" },
  flagClose: { backgroundColor: "#FFEDD5", color: "#C2410C" },
  meta: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4 },
  ref: { fontSize: 12, color: ownerColors.textDim, marginTop: 6 },
});
