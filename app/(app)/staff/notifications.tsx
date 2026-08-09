import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import {
  useMarkAllStaffNotificationsRead,
  useMarkStaffNotificationRead,
  useStaffNotifications,
  type StaffNotification,
} from "@/hooks/useStaffNotifications";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StaffNotificationsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useStaffNotifications();
  const markRead = useMarkStaffNotificationRead();
  const markAll = useMarkAllStaffNotificationsRead();

  const items = data ?? [];

  const onPress = (n: StaffNotification) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.metadata?.appointment_id) {
      router.push("/(app)/staff/(tabs)/calendar" as Href);
    }
  };

  return (
    <View style={styles.screen}>
      <StaffAppBar title="Notifications" displayTitle />
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
            style={{ flex: 1, backgroundColor: colors.bg }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={colors.primary}
              />
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
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1, backgroundColor: colors.bg },
    markAll: { alignItems: "flex-end", padding: 16, paddingBottom: 0 },
    markAllText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    list: { padding: 16, paddingBottom: 32 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    cardUnread: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    title: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    body: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
      fontFamily: ownerFonts.regular,
    },
    when: {
      fontSize: 12,
      color: colors.textDim,
      marginTop: 8,
      fontFamily: ownerFonts.regular,
    },
  });
}
