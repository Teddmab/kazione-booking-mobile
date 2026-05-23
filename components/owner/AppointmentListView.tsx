import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors } from "@/constants/ownerTheme";
import {
  clientDisplayName,
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/format";
import type { AppointmentWithRelations } from "@/types/owner";

interface Props {
  appointments: AppointmentWithRelations[];
  isRefetching: boolean;
  onRefresh: () => void;
  onSelect: (appt: AppointmentWithRelations) => void;
}

export function AppointmentListView({
  appointments,
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
        return (
          <Pressable style={styles.card} onPress={() => onSelect(item)}>
            <View style={styles.rowTop}>
              <Text style={styles.time}>{formatTime(item.starts_at)}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.date}>{formatDate(item.starts_at)}</Text>
            <Text style={styles.name}>{name}</Text>
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
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 12,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: { fontSize: 16, fontWeight: "700", color: ownerColors.primary },
  date: { fontSize: 12, color: ownerColors.textDim, marginTop: 2, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  meta: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4 },
  ref: { fontSize: 12, color: ownerColors.textDim, marginTop: 6 },
});
