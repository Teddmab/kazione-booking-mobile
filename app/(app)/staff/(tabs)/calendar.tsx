import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import { AppointmentStatusSheet } from "@/components/staff/AppointmentStatusSheet";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { VoucherScanSheet } from "@/components/staff/VoucherScanSheet";
import { WeekNav } from "@/components/staff/calendar/WeekNav";
import { WeeklyCalendar } from "@/components/staff/calendar/WeeklyCalendar";
import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useRespondToAppointmentOffer,
  useStaffAppointments,
  useStaffOfferedAppointments,
  useStaffPendingCompletionAppointments,
  useUpdateStaffAppointmentStatus,
} from "@/hooks/useStaffAppointments";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { clientDisplayName, formatTime } from "@/lib/format";
import { addDays, startOfWeekMonday, toIsoDateLocal } from "@/lib/staffCalendar";
import type { StaffAppointment } from "@/services/staff/appointments";

const VIEW_KEY = "staff-appointments-view";
const WEEK_KEY = "staff_calendar_week_start";

type ViewMode = "list" | "week";
type ListFilter = "today" | "upcoming" | "last7" | "last30";

function StatTile({
  label,
  value,
  hint,
  styles,
}: {
  label: string;
  value: string;
  hint?: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

function ListApptRow({
  appointment,
  showDate,
  onPress,
}: {
  appointment: StaffAppointment;
  showDate?: boolean;
  onPress: () => void;
}) {
  const { i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const name = clientDisplayName(
    appointment.client.first_name,
    appointment.client.last_name,
  );
  const dateLabel = new Date(appointment.starts_at).toLocaleDateString(i18n.language, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const inProgress = appointment.status === "in_progress";

  return (
    <Pressable
      style={[styles.listCard, inProgress && styles.listCardActive]}
      onPress={onPress}>
      <View style={styles.listTimeCol}>
        {showDate ? <Text style={styles.listDate}>{dateLabel}</Text> : null}
        <Text style={styles.listTime}>{formatTime(appointment.starts_at)}</Text>
        <Text style={styles.listDuration}>
          {appointment.service.duration_minutes} min
        </Text>
      </View>
      <View
        style={[
          styles.listBar,
          appointment.status === "completed" || appointment.status === "pending_completion"
            ? styles.listBarDone
            : inProgress
              ? styles.listBarActive
              : null,
        ]}
      />
      <View style={styles.listBody}>
        <Text style={styles.listClient} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.listService} numberOfLines={1}>
          {appointment.service.name}
        </Text>
      </View>
      <StatusBadge status={appointment.status} />
      <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
    </Pressable>
  );
}

export default function StaffCalendarScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [listView, setListView] = useState<ListFilter>("today");
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [selected, setSelected] = useState<StaffAppointment | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [offerBusyId, setOfferBusyId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void Promise.all([
      AsyncStorage.getItem(VIEW_KEY),
      AsyncStorage.getItem(WEEK_KEY),
    ]).then(([view, week]) => {
      if (view === "week" || view === "list") setViewMode(view);
      if (week) {
        const d = new Date(week);
        if (!Number.isNaN(d.getTime())) setWeekStart(startOfWeekMonday(d));
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(VIEW_KEY, viewMode);
  }, [viewMode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(WEEK_KEY, weekStart.toISOString());
  }, [weekStart, hydrated]);

  const today = useMemo(() => toIsoDateLocal(new Date()), []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toIsoDateLocal(d);
  }, []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toIsoDateLocal(d);
  }, []);
  const weekEndIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toIsoDateLocal(d);
  }, []);
  const last7Start = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toIsoDateLocal(d);
  }, []);
  const last30Start = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toIsoDateLocal(d);
  }, []);

  const todayQ = useStaffAppointments(today, today, 50);
  const upcomingQ = useStaffAppointments(tomorrow, weekEndIso, 30);
  const last7Q = useStaffAppointments(last7Start, yesterday, 50);
  const last30Q = useStaffAppointments(last30Start, yesterday, 100);
  const offersQ = useStaffOfferedAppointments();
  const pendingCompletionQ = useStaffPendingCompletionAppointments();

  const calWeekEnd = addDays(weekStart, 6);
  const weekQ = useStaffAppointments(
    toIsoDateLocal(weekStart),
    toIsoDateLocal(calWeekEnd),
  );
  const { data: staffSelf } = useStaffSelf();
  const updateStatus = useUpdateStaffAppointmentStatus();
  const respondOffer = useRespondToAppointmentOffer();

  const todayAppts = useMemo(
    () =>
      [...(todayQ.data ?? [])]
        .filter((a) => a.status !== "cancelled")
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
    [todayQ.data],
  );

  const upcomingAppts = useMemo(
    () =>
      [...(upcomingQ.data ?? [])]
        .filter((a) => a.status !== "cancelled")
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
    [upcomingQ.data],
  );

  const last7Appts = useMemo(
    () =>
      [...(last7Q.data ?? [])].sort(
        (a, b) =>
          new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
      ),
    [last7Q.data],
  );

  const last30Appts = useMemo(
    () =>
      [...(last30Q.data ?? [])].sort(
        (a, b) =>
          new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
      ),
    [last30Q.data],
  );

  const completed = todayAppts.filter(
    (a) => a.status === "completed" || a.status === "pending_completion",
  ).length;
  const remaining = todayAppts.filter(
    (a) => a.status === "pending" || a.status === "confirmed",
  ).length;
  const totalMinutes = todayAppts.reduce(
    (s, a) => s + (a.service.duration_minutes ?? 0),
    0,
  );

  const pendingOffers = offersQ.data ?? [];
  const pendingCompletionAppts = pendingCompletionQ.data ?? [];

  function switchView(v: ViewMode) {
    setViewMode(v);
  }

  function handleStartNext() {
    const allAppts = [...todayAppts, ...upcomingAppts];
    const next = allAppts
      .filter((a) => a.status === "pending" || a.status === "confirmed")
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      )[0];
    if (!next) {
      toast.warning(
        t("staffToday.toastNoStartTitle"),
        t("staffToday.toastNoStartBody"),
      );
      return;
    }
    updateStatus.mutate(
      { appointmentId: next.id, status: "in_progress" },
      {
        onSuccess: () =>
          toast.success(
            t("staffToday.toastStartedTitle"),
            t("staffToday.toastStartedBody", { service: next.service.name }),
          ),
        onError: (err: Error) =>
          toast.error(
            t("staffToday.error"),
            err.message || t("staffToday.toastStartError"),
          ),
      },
    );
  }

  function handleOffer(offer: StaffAppointment, response: "accept" | "decline") {
    setOfferBusyId(offer.id);
    respondOffer.mutate(
      { appointmentId: offer.id, response },
      {
        onSuccess: () =>
          toast.success(
            t("staffToday.toastOfferTitle"),
            response === "accept"
              ? t("staffToday.toastOfferAccepted")
              : t("staffToday.toastOfferDeclined"),
          ),
        onError: (err: Error) =>
          toast.error(
            t("staffToday.error"),
            err.message || t("staffToday.toastOfferError"),
          ),
        onSettled: () => setOfferBusyId(null),
      },
    );
  }

  async function onRefresh() {
    await Promise.all([
      todayQ.refetch(),
      upcomingQ.refetch(),
      last7Q.refetch(),
      last30Q.refetch(),
      offersQ.refetch(),
      pendingCompletionQ.refetch(),
      weekQ.refetch(),
    ]);
  }

  const refreshing =
    todayQ.isRefetching ||
    upcomingQ.isRefetching ||
    last7Q.isRefetching ||
    last30Q.isRefetching ||
    offersQ.isRefetching ||
    pendingCompletionQ.isRefetching ||
    weekQ.isRefetching;

  const listAppts =
    listView === "today"
      ? todayAppts
      : listView === "upcoming"
        ? upcomingAppts
        : listView === "last7"
          ? last7Appts
          : last30Appts;

  const listLoading =
    listView === "today"
      ? todayQ.isLoading
      : listView === "upcoming"
        ? upcomingQ.isLoading
        : listView === "last7"
          ? last7Q.isLoading
          : last30Q.isLoading;

  const emptyLabel =
    listView === "today"
      ? t("staffCalendar.emptyToday")
      : listView === "upcoming"
        ? t("staffCalendar.emptyUpcoming")
        : t("staffCalendar.emptyPeriod");

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={t("staffCalendar.title")}
        subtitle={
          viewMode === "week"
            ? t("staffCalendar.subtitleWeek")
            : t("staffCalendar.subtitleList")
        }
        displayTitle
        rightSlot={
          <View style={styles.headerActions}>
            <Pressable style={styles.scanBtn} onPress={() => setVoucherOpen(true)}>
              <Ionicons name="qr-code-outline" size={14} color={colors.primary} />
              <Text style={styles.scanBtnText}>{t("staffCalendar.scan")}</Text>
            </Pressable>
            <Pressable
              style={[styles.startBtn, updateStatus.isPending && styles.disabled]}
              disabled={updateStatus.isPending}
              onPress={handleStartNext}>
              <Ionicons name="play" size={14} color="#fff" />
              <Text style={styles.startBtnText}>{t("staffCalendar.startNext")}</Text>
            </Pressable>
          </View>
        }
        bottomSlot={
          viewMode === "week" ? (
            <WeekNav
              weekStart={weekStart}
              onPrev={() => setWeekStart((d) => addDays(d, -7))}
              onNext={() => setWeekStart((d) => addDays(d, 7))}
              onToday={() => setWeekStart(startOfWeekMonday(new Date()))}
            />
          ) : null
        }
      />

      {viewMode === "week" ? (
        <WeeklyCalendar
          weekStart={weekStart}
          appointments={weekQ.data ?? []}
          workingDays={staffSelf?.working_hours ?? []}
          onSelect={setSelected}
        />
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
            />
          }>
          <View style={styles.statsRow}>
            <StatTile
              label={t("staffCalendar.statToday")}
              value={todayQ.isLoading ? "…" : String(todayAppts.length)}
              hint={
                completed > 0
                  ? `${completed} ${t("staffStatus.completed")}`
                  : undefined
              }
              styles={styles}
            />
            <StatTile
              label={t("staffCalendar.statRemaining")}
              value={String(remaining)}
              styles={styles}
            />
            <StatTile
              label={t("staffCalendar.statDuration")}
              value={`${totalMinutes} min`}
              hint={`${(totalMinutes / 60).toFixed(1)} ${t("staffCalendar.hrs")}`}
              styles={styles}
            />
            <StatTile
              label={t("staffCalendar.statWeek")}
              value={String(upcomingAppts.length)}
              styles={styles}
            />
          </View>

          {pendingOffers.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="notifications" size={16} color="#7C3AED" />
                <Text style={styles.sectionTitle}>{t("staffCalendar.offersTitle")}</Text>
                <View style={styles.violetBadge}>
                  <Text style={styles.badgeText}>{pendingOffers.length}</Text>
                </View>
              </View>
              {pendingOffers.map((offer) => {
                const busy = offerBusyId === offer.id || respondOffer.isPending;
                const name = clientDisplayName(
                  offer.client.first_name,
                  offer.client.last_name,
                );
                return (
                  <View key={offer.id} style={styles.offerCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.offerService}>{offer.service.name}</Text>
                      <Text style={styles.offerMeta}>
                        {name} · {formatTime(offer.starts_at)}
                      </Text>
                      {offer.referral_staff_id ? (
                        <Text style={styles.referralHint}>{t("staffCalendar.referral")}</Text>
                      ) : null}
                    </View>
                    <View style={styles.offerActions}>
                      <Pressable
                        style={[styles.declineBtn, busy && styles.disabled]}
                        disabled={busy}
                        onPress={() => handleOffer(offer, "decline")}>
                        <Text style={styles.declineText}>{t("staffCalendar.decline")}</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.acceptBtn, busy && styles.disabled]}
                        disabled={busy}
                        onPress={() => handleOffer(offer, "accept")}>
                        <Text style={styles.acceptText}>{t("staffCalendar.accept")}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {pendingCompletionAppts.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="hourglass-outline" size={16} color="#D97706" />
                <Text style={styles.sectionTitle}>
                  {t("staffCalendar.pendingCompletionTitle")}
                </Text>
                <View style={styles.amberBadge}>
                  <Text style={styles.badgeText}>{pendingCompletionAppts.length}</Text>
                </View>
              </View>
              {pendingCompletionAppts.map((appt) => {
                const name = clientDisplayName(
                  appt.client.first_name,
                  appt.client.last_name,
                );
                return (
                  <View key={appt.id} style={styles.pendingCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.offerService}>{appt.service.name}</Text>
                      <Text style={styles.offerMeta}>
                        {name} · {formatTime(appt.starts_at)}
                      </Text>
                    </View>
                    <View style={styles.waitingPill}>
                      <Text style={styles.waitingText}>
                        {t("staffCalendar.pendingCompletionHint")}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.toggleRow}>
            <View style={styles.toggleGroup}>
              {(
                [
                  {
                    key: "list" as const,
                    labelKey: "staffCalendar.viewList" as const,
                    icon: "list" as const,
                  },
                  {
                    key: "week" as const,
                    labelKey: "staffCalendar.viewWeek" as const,
                    icon: "calendar-outline" as const,
                  },
                ] as const
              ).map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.toggleBtn,
                    viewMode === opt.key && styles.toggleBtnActive,
                  ]}
                  onPress={() => switchView(opt.key)}>
                  <Ionicons
                    name={opt.icon}
                    size={14}
                    color={
                      viewMode === opt.key
                        ? colors.primary
                        : colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      viewMode === opt.key && styles.toggleTextActive,
                    ]}>
                    {t(opt.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subfilters}>
            {(
              [
                { key: "today" as const, labelKey: "staffCalendar.filterToday" as const },
                {
                  key: "upcoming" as const,
                  labelKey: "staffCalendar.filterUpcoming" as const,
                },
                { key: "last7" as const, labelKey: "staffCalendar.filterLast7" as const },
                {
                  key: "last30" as const,
                  labelKey: "staffCalendar.filterLast30" as const,
                },
              ] as const
            ).map((opt) => (
              <Pressable
                key={opt.key}
                style={[
                  styles.subfilterBtn,
                  listView === opt.key && styles.subfilterBtnActive,
                ]}
                onPress={() => setListView(opt.key)}>
                <Text
                  style={[
                    styles.subfilterText,
                    listView === opt.key && styles.subfilterTextActive,
                  ]}>
                  {t(opt.labelKey)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {listLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 24 }}
            />
          ) : listAppts.length === 0 ? (
            <Text style={styles.empty}>{emptyLabel}</Text>
          ) : (
            listAppts.map((apt) => (
              <ListApptRow
                key={apt.id}
                appointment={apt}
                showDate={listView !== "today"}
                onPress={() => setSelected(apt)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Always show list/week toggle when in week mode so user can switch back */}
      {viewMode === "week" ? (
        <View style={styles.weekToggleBar}>
          <View style={styles.toggleGroup}>
            <Pressable style={styles.toggleBtn} onPress={() => switchView("list")}>
              <Ionicons name="list" size={14} color={colors.textMuted} />
              <Text style={styles.toggleText}>{t("staffCalendar.switchToList")}</Text>
            </Pressable>
            <Pressable style={[styles.toggleBtn, styles.toggleBtnActive]}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={[styles.toggleText, styles.toggleTextActive]}>
                {t("staffCalendar.switchToWeek")}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <AppointmentStatusSheet
        appointment={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
      <VoucherScanSheet visible={voucherOpen} onClose={() => setVoucherOpen(false)} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scanBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  statTile: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
    fontFamily: ownerFonts.bold,
  },
  statHint: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  section: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    fontFamily: ownerFonts.bold,
  },
  violetBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  amberBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: ownerFonts.bold,
  },
  offerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  offerService: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    fontFamily: ownerFonts.semiBold,
  },
  offerMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  referralHint: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 4,
    fontFamily: ownerFonts.medium,
  },
  offerActions: { flexDirection: "row", gap: 6 },
  declineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  declineText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: ownerFonts.semiBold,
  },
  acceptBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  acceptText: {
    fontSize: 12,
    color: "#fff",
    fontFamily: ownerFonts.semiBold,
  },
  waitingPill: {
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  waitingText: {
    fontSize: 10,
    color: "#92400E",
    fontFamily: ownerFonts.semiBold,
  },
  toggleRow: { marginBottom: 10 },
  toggleGroup: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.card,
  },
  toggleText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  weekToggleBar: {
    position: "absolute",
    left: 16,
    bottom: 16,
    zIndex: 5,
  },
  subfilters: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    paddingRight: 8,
  },
  subfilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  subfilterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  subfilterText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  subfilterTextActive: {
    color: colors.primary,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  listCardActive: {
    borderColor: colors.primary + "66",
    backgroundColor: colors.primarySurface,
  },
  listTimeCol: { width: 64, alignItems: "center" },
  listDate: {
    fontSize: 10,
    color: colors.primary,
    textTransform: "uppercase",
    fontFamily: ownerFonts.semiBold,
  },
  listTime: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    fontFamily: ownerFonts.bold,
  },
  listDuration: {
    fontSize: 10,
    color: colors.textDim,
    fontFamily: ownerFonts.regular,
  },
  listBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  listBarDone: { backgroundColor: "#059669" },
  listBarActive: { backgroundColor: colors.primary },
  listBody: { flex: 1, minWidth: 0 },
  listClient: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    fontFamily: ownerFonts.semiBold,
  },
  listService: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  empty: {
    textAlign: "center",
    color: colors.textDim,
    fontSize: 14,
    marginTop: 32,
    fontFamily: ownerFonts.regular,
  },
  disabled: { opacity: 0.6 },
  });
}
