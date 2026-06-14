import { useRouter, type Href } from "expo-router";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { QueryState } from "@/components/owner/QueryState";
import { ownerColors } from "@/constants/ownerTheme";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useOwnerNotifications,
} from "@/hooks/useOwnerNotifications";
import type { OwnerNotification } from "@/services/owner/notifications";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OwnerNotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useOwnerNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data ?? [];

  const onPress = (n: OwnerNotification) => {
    if (!n.is_read) markRead.mutate(n.id);
    const apptId = n.metadata?.appointment_id;
    if (apptId) {
      router.push("/(app)/owner/(tabs)/appointments" as Href);
    }
  };

  return (
    <OwnerStackShell title="Notifications">
    <View style={styles.flex}>
      {items.some((n) => !n.is_read) ? (
        <Pressable
          style={styles.markAll}
          onPress={() => markAll.mutate()}
          disabled={markAll.isPending}>
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </Pressable>
      ) : null}

      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && items.length === 0}
        emptyMessage="Aucune notification."
        onRetry={() => void refetch()}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, !item.is_read && styles.cardUnread]}
              onPress={() => onPress(item)}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.when}>{formatWhen(item.created_at)}</Text>
            </Pressable>
          )}
        />
      </QueryState>
    </View>
    </OwnerStackShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  markAll: { alignItems: "flex-end", padding: 16, paddingBottom: 0 },
  markAllText: { fontSize: 14, color: ownerColors.primary, fontWeight: "600" },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  title: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  body: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4 },
  when: { fontSize: 12, color: ownerColors.textDim, marginTop: 8 },
});
