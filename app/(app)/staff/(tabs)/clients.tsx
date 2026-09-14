import { useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { StaffClientDetailSheet } from "@/components/staff/StaffClientDetailSheet";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useStaffAppointments } from "@/hooks/useStaffAppointments";
import { useStaffClients } from "@/hooks/useStaffClients";
import { zonedDateKey } from "@/lib/businessTime";
import { formatDate, formatTime, localeForLanguage } from "@/lib/format";
import {
  daysSinceVisit,
  FOLLOW_UP_AFTER_DAYS,
  getStaffClientStatus,
  needsFollowUp,
  type StaffClientStatus,
} from "@/lib/staffClientStatus";
import type { StaffAppointment } from "@/services/staff/appointments";
import type { ClientWithStats } from "@/types/owner";

type TabKey = "recent" | "followup" | "all";
type StatusFilter = "All" | StaffClientStatus;

const AVATAR_COLORS = [
  "#C4B5FD",
  "#93C5FD",
  "#86EFAC",
  "#FCD34D",
  "#FDA4AF",
  "#A5B4FC",
  "#F9A8D4",
];

type EnrichedClient = ClientWithStats & {
  status: StaffClientStatus;
  lastServiceName: string | null;
  nextAppointment: StaffAppointment | null;
  followUp: boolean;
  daysSince: number | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * 17) % 997;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase().slice(0, 2) || "?";
}

function formatVisitDate(
  iso: string | null,
  language: string,
  timeZone: string,
): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(localeForLanguage(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  });
}

function formatNextAppt(
  appt: StaffAppointment,
  language: string,
  timeZone: string,
): string {
  const date = formatDate(appt.starts_at, language, timeZone);
  const time = formatTime(appt.starts_at, language, timeZone);
  return `${date} · ${time}`;
}

function FollowUpButton({
  onPress,
  styles,
  colors,
  label,
}: {
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
  label: string;
}) {
  return (
    <Pressable style={styles.followBtn} onPress={onPress}>
      <Ionicons name="paper-plane-outline" size={14} color={colors.primary} />
      <Text style={styles.followBtnText}>{label}</Text>
    </Pressable>
  );
}

export default function StaffClientsScreen() {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tenant } = useTenantContext();
  const timeZone = tenant?.timezone ?? "Europe/Tallinn";
  const settings = useBusinessSettings(tenant?.businessId ?? "");
  const currency = settings.data?.settings?.currency_code ?? "EUR";

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [selected, setSelected] = useState<ClientWithStats | null>(null);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [showAllFollowUps, setShowAllFollowUps] = useState(false);

  const range = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 120);
    const to = new Date(now);
    to.setDate(to.getDate() + 90);
    return { from: isoLocal(from), to: isoLocal(to) };
  }, []);

  const clientsQ = useStaffClients(search);
  const apptsQ = useStaffAppointments(range.from, range.to, 500);

  const enriched = useMemo(() => {
    const todayKey = zonedDateKey(new Date().toISOString(), timeZone);
    const byClient = new Map<
      string,
      { last: StaffAppointment | null; next: StaffAppointment | null }
    >();

    for (const a of apptsQ.data ?? []) {
      if (a.status === "cancelled" || a.status === "no_show") continue;
      const cid = a.client?.id;
      if (!cid) continue;
      const day = zonedDateKey(a.starts_at, timeZone);
      const bucket = byClient.get(cid) ?? { last: null, next: null };
      const isPastOrDone =
        a.status === "completed" ||
        a.status === "pending_completion" ||
        day < todayKey;
      const isUpcoming =
        day > todayKey ||
        (day === todayKey &&
          a.status !== "completed" &&
          a.status !== "pending_completion");

      if (isPastOrDone) {
        if (
          !bucket.last ||
          new Date(a.starts_at) > new Date(bucket.last.starts_at)
        ) {
          bucket.last = a;
        }
      }
      if (isUpcoming) {
        if (
          !bucket.next ||
          new Date(a.starts_at) < new Date(bucket.next.starts_at)
        ) {
          bucket.next = a;
        }
      }
      byClient.set(cid, bucket);
    }

    return (clientsQ.data?.clients ?? []).map((c): EnrichedClient => {
      const bucket = byClient.get(c.id);
      const next = bucket?.next ?? null;
      const lastSvc = bucket?.last?.service.name ?? null;
      const followUp = needsFollowUp({
        lastVisit: c.last_visit,
        hasUpcoming: !!next,
        appointmentCount: c.appointment_count,
      });
      return {
        ...c,
        status: getStaffClientStatus(c.appointment_count),
        lastServiceName: lastSvc,
        nextAppointment: next,
        followUp,
        daysSince: daysSinceVisit(c.last_visit),
      };
    });
  }, [clientsQ.data?.clients, apptsQ.data, timeZone]);

  const statusFiltered = useMemo(
    () =>
      statusFilter === "All"
        ? enriched
        : enriched.filter((c) => c.status === statusFilter),
    [enriched, statusFilter],
  );

  const followUps = useMemo(
    () =>
      [...statusFiltered]
        .filter((c) => c.followUp)
        .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0)),
    [statusFiltered],
  );

  const list = useMemo(() => {
    let rows = statusFiltered;
    if (tab === "followup") {
      rows = followUps;
    } else if (tab === "recent") {
      rows = [...statusFiltered].sort((a, b) => {
        const ta = a.last_visit ? new Date(a.last_visit).getTime() : 0;
        const tb = b.last_visit ? new Date(b.last_visit).getTime() : 0;
        return tb - ta;
      });
    } else {
      rows = [...statusFiltered].sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`,
        ),
      );
    }
    return rows;
  }, [statusFiltered, followUps, tab]);

  const previewFollowUps = showAllFollowUps
    ? followUps
    : followUps.slice(0, 2);

  async function onRefresh() {
    setPullRefreshing(true);
    try {
      await Promise.all([clientsQ.refetch(), apptsQ.refetch()]);
    } finally {
      setPullRefreshing(false);
    }
  }

  function openStatusFilter() {
    const options: { key: StatusFilter; label: string }[] = [
      { key: "All", label: t("staffClientsPage.filterAllStatuses") },
      { key: "Frequent", label: t("staffClientsPage.statusFrequent") },
      { key: "Returning", label: t("staffClientsPage.statusReturning") },
      { key: "New", label: t("staffClientsPage.statusNew") },
    ];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options.map((o) => o.label), t("common.cancel")],
          cancelButtonIndex: options.length,
        },
        (idx) => {
          if (idx == null || idx >= options.length) return;
          setStatusFilter(options[idx].key);
        },
      );
      return;
    }
    Alert.alert(
      t("staffClientsPage.filter"),
      undefined,
      [
        ...options.map((o) => ({
          text: o.label,
          onPress: () => setStatusFilter(o.key),
        })),
        { text: t("common.cancel"), style: "cancel" as const },
      ],
    );
  }

  async function sendFollowUp(client: EnrichedClient) {
    const name = `${client.first_name} ${client.last_name}`.trim();
    const body = t("staffClientsPage.followUpSmsBody", {
      name: client.first_name || name,
      salon: tenant?.businessName ?? "KaziOne",
    });
    if (client.phone) {
      const phone = client.phone.replace(/\s+/g, "");
      const url = `sms:${phone}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(body)}`;
      const can = await Linking.canOpenURL(url).catch(() => false);
      if (can) {
        await Linking.openURL(url);
        return;
      }
    }
    setSelected(client);
  }

  const tabs: { key: TabKey; labelKey: string }[] = [
    { key: "recent", labelKey: "staffClientsPage.tabRecent" },
    { key: "followup", labelKey: "staffClientsPage.tabFollowUp" },
    { key: "all", labelKey: "staffClientsPage.tabAll" },
  ];

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={t("staffClientsPage.title")}
        displayTitle
        rightSlot={
          <View style={styles.privacyIcon} accessibilityLabel={t("staffClientsPage.privacyNote")}>
            <Ionicons name="shield-checkmark" size={18} color={colors.textMuted} />
          </View>
        }
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder={t("staffClientsPage.searchPh")}
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
            />
          </View>
          <Pressable style={styles.filterBtn} onPress={openStatusFilter}>
            <Ionicons name="options-outline" size={16} color={colors.text} />
            <Text style={styles.filterBtnText}>
              {t("staffClientsPage.filter")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(item.key)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "recent" && followUps.length > 0 ? (
          <View style={styles.followSection}>
            <View style={styles.followHeader}>
              <View style={styles.followTitleRow}>
                <Text style={styles.followTitle}>
                  {t("staffClientsPage.followUpsTitle")}
                </Text>
                <View style={styles.followBadge}>
                  <Text style={styles.followBadgeText}>{followUps.length}</Text>
                </View>
              </View>
              {followUps.length > 2 ? (
                <Pressable onPress={() => setShowAllFollowUps((v) => !v)}>
                  <Text style={styles.seeAll}>
                    {showAllFollowUps
                      ? t("staffClientsPage.showLess")
                      : t("staffClientsPage.seeAll")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.followCard}>
              {previewFollowUps.map((c) => {
                const name = `${c.first_name} ${c.last_name}`.trim();
                return (
                  <View key={c.id} style={styles.followRow}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: avatarColor(name) },
                      ]}>
                      <Text style={styles.avatarText}>
                        {initials(c.first_name, c.last_name)}
                      </Text>
                    </View>
                    <View style={styles.followBody}>
                      <Text style={styles.name} numberOfLines={1}>
                        {name || t("staffClientsPage.clientFallback")}
                      </Text>
                      <View style={styles.followMetaRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={colors.primary}
                        />
                        <Text style={styles.followMeta}>
                          {t("staffClientsPage.followUpSince", {
                            count: c.daysSince ?? FOLLOW_UP_AFTER_DAYS,
                          })}
                        </Text>
                      </View>
                    </View>
                    <FollowUpButton
                      styles={styles}
                      colors={colors}
                      label={t("staffClientsPage.sendFollowUp")}
                      onPress={() => void sendFollowUp(c)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <QueryState
          loading={clientsQ.isLoading}
          error={clientsQ.isError ? (clientsQ.error as Error) : null}
          empty={!clientsQ.isLoading && list.length === 0}
          emptyMessage={t("staffClientsPage.empty")}
          onRetry={() => void clientsQ.refetch()}>
          {list.map((c) => {
            const name = `${c.first_name} ${c.last_name}`.trim();
            const hasNext = !!c.nextAppointment;
            return (
              <Pressable
                key={c.id}
                style={styles.clientRow}
                onPress={() => setSelected(c)}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: avatarColor(name) },
                  ]}>
                  <Text style={styles.avatarText}>
                    {initials(c.first_name, c.last_name)}
                  </Text>
                </View>
                <View style={styles.clientMain}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name || t("staffClientsPage.clientFallback")}
                  </Text>
                  <Text style={styles.fieldLabel}>
                    {t("staffClientsPage.lastService")}
                  </Text>
                  <Text style={styles.fieldValue} numberOfLines={1}>
                    {c.lastServiceName ??
                      t("staffClientsPage.lastServiceUnknown")}
                  </Text>
                  <Text style={styles.fieldDate}>
                    {formatVisitDate(c.last_visit, i18n.language, timeZone)}
                  </Text>
                </View>
                <View style={styles.clientRight}>
                  {hasNext && c.nextAppointment ? (
                    <>
                      <Text style={styles.fieldLabel}>
                        {t("staffClientsPage.nextAppointment")}
                      </Text>
                      <View style={styles.nextRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={colors.text}
                        />
                        <Text style={styles.nextWhen} numberOfLines={2}>
                          {formatNextAppt(
                            c.nextAppointment,
                            i18n.language,
                            timeZone,
                          )}
                        </Text>
                      </View>
                      {c.nextAppointment.service?.name ? (
                        <View style={styles.tag}>
                          <Text style={styles.tagText} numberOfLines={1}>
                            {c.nextAppointment.service.name}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.viewLink}>
                        <Text style={styles.viewLinkText}>
                          {t("staffClientsPage.viewProfile")}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.textDim}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.fieldLabel}>
                        {t("staffClientsPage.noAppointment")}
                      </Text>
                      {c.followUp ? (
                        <>
                          <Text style={styles.relance}>
                            {t("staffClientsPage.followUpRecommended")}
                          </Text>
                          <FollowUpButton
                            styles={styles}
                            colors={colors}
                            label={t("staffClientsPage.sendFollowUp")}
                            onPress={() => void sendFollowUp(c)}
                          />
                        </>
                      ) : (
                        <View style={styles.viewLink}>
                          <Text style={styles.viewLinkText}>
                            {t("staffClientsPage.viewProfile")}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={colors.textDim}
                          />
                        </View>
                      )}
                    </>
                  )}
                </View>
              </Pressable>
            );
          })}
        </QueryState>

        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={12} color={colors.textDim} />
          <Text style={styles.privacyText}>
            {t("staffClientsPage.privacyNote")}
          </Text>
        </View>
      </ScrollView>

      <StaffClientDetailSheet
        client={selected}
        visible={!!selected}
        currency={currency}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40, gap: 14 },
    privacyIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    searchWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.card,
    },
    search: {
      flex: 1,
      paddingVertical: 11,
      fontSize: 14,
      color: colors.text,
      fontFamily: ownerFonts.regular,
    },
    filterBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: colors.card,
    },
    filterBtnText: {
      fontSize: 13,
      fontFamily: ownerFonts.medium,
      color: colors.text,
    },
    tabs: {
      flexDirection: "row",
      gap: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.primary,
      backgroundColor: colors.primarySurface,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    tabText: {
      fontSize: 13,
      fontFamily: ownerFonts.medium,
      color: colors.textMuted,
    },
    tabTextActive: {
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    followSection: { gap: 8 },
    followHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    followTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    followTitle: {
      fontSize: 15,
      fontFamily: ownerFonts.bold,
      color: colors.text,
    },
    followBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    followBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontFamily: ownerFonts.bold,
    },
    seeAll: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    followCard: {
      backgroundColor: colors.primarySurface,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.primary + "33",
    },
    followRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.primary + "22",
    },
    followBody: { flex: 1, minWidth: 0, gap: 3 },
    followMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    followMeta: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: ownerFonts.medium,
      flexShrink: 1,
    },
    followBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
      backgroundColor: colors.card,
    },
    followBtnText: {
      fontSize: 11,
      fontFamily: ownerFonts.semiBold,
      color: colors.primary,
    },
    clientRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 13,
      fontFamily: ownerFonts.bold,
      color: colors.text,
    },
    clientMain: { flex: 1.1, minWidth: 0, gap: 2 },
    clientRight: {
      flex: 1,
      minWidth: 0,
      alignItems: "flex-start",
      gap: 4,
    },
    name: {
      fontSize: 15,
      fontFamily: ownerFonts.bold,
      color: colors.text,
      marginBottom: 2,
    },
    fieldLabel: {
      fontSize: 11,
      color: colors.textDim,
      fontFamily: ownerFonts.medium,
    },
    fieldValue: {
      fontSize: 13,
      color: colors.text,
      fontFamily: ownerFonts.medium,
    },
    fieldDate: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    nextRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 4,
    },
    nextWhen: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
      fontFamily: ownerFonts.medium,
    },
    tag: {
      alignSelf: "flex-start",
      backgroundColor: colors.primarySurface,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginTop: 2,
    },
    tagText: {
      fontSize: 11,
      color: colors.primary,
      fontFamily: ownerFonts.medium,
      maxWidth: 120,
    },
    viewLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginTop: 4,
    },
    viewLinkText: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    relance: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
      marginBottom: 4,
    },
    privacyRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 4,
    },
    privacyText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 15,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
    },
  });
}
