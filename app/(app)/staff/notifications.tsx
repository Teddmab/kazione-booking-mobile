import { Ionicons } from "@expo/vector-icons";
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
import { useTranslation } from "react-i18next";

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
import { formatRelativeTime } from "@/lib/format";
import { getNotificationIcon } from "@/lib/notificationUi";

export default function StaffNotificationsScreen() {
  const { t, i18n } = useTranslation();
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
      <StaffAppBar title={t("staffNotifPage.title")} displayTitle />
      <View style={styles.flex}>
        {items.some((n) => !n.is_read) ? (
          <Pressable
            style={styles.markAll}
            onPress={() => markAll.mutate()}
            disabled={markAll.isPending}>
            <Text style={styles.markAllText}>{t("staffNotifPage.markAll")}</Text>
          </Pressable>
        ) : null}

        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          empty={!isLoading && items.length === 0}
          emptyMessage={t("staffNotifPage.empty")}
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
                <View style={styles.iconCol}>
                  <Ionicons
                    name={getNotificationIcon(item.type)}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.bodyCol}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.when}>
                    {formatRelativeTime(item.created_at, i18n.language)}
                  </Text>
                </View>
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
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
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
    iconCol: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    bodyCol: { flex: 1, gap: 4 },
    title: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    body: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    when: {
      fontSize: 12,
      color: colors.textDim,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
  });
}
