import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { AppointmentStatusSheet } from "@/components/staff/AppointmentStatusSheet";
import { ArrivalStepper } from "@/components/staff/ArrivalStepper";
import { HelpBubble } from "@/components/staff/HelpBubble";
import { OnboardingBanner } from "@/components/staff/OnboardingBanner";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { VoucherScanSheet } from "@/components/staff/VoucherScanSheet";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import {
  calendarMonthRange,
  useMyPerformanceRange,
} from "@/hooks/useMyPerformance";
import {
  useMarkArrived,
  useMarkNotesReviewed,
  useRespondToAppointmentOffer,
  useStaffAppointments,
  useStaffOfferedAppointments,
  useUpdateStaffAppointmentStatus,
} from "@/hooks/useStaffAppointments";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { useStaffServices } from "@/hooks/useStaffServices";
import { useStaffTraining } from "@/hooks/useStaffTraining";
import { commissionLabel } from "@/lib/commissionLabel";
import {
  clientDisplayName,
  formatDateLong,
  formatTime,
  localeForLanguage,
} from "@/lib/format";
import { toIsoDateLocal } from "@/lib/ownerCalendar";
import type { StaffAppointment } from "@/services/staff/appointments";
import type { StaffService } from "@/services/staff/services";

function money(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function projectMonthEnd(
  soFar: number,
  dayOfMonth: number,
  daysInMonth: number,
): number {
  if (dayOfMonth === 0) return 0;
  return Math.round((soFar / dayOfMonth) * daysInMonth);
}

function greetingKeyForHour(
  h: number,
): "staffToday.morning" | "staffToday.afternoon" | "staffToday.evening" {
  if (h < 12) return "staffToday.morning";
  if (h < 17) return "staffToday.afternoon";
  return "staffToday.evening";
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDateLocal(d);
}

function minutesUntilLabel(
  startIso: string,
  t: (key: string, opts?: Record<string, string | number>) => string,
): string | null {
  const diffMin = Math.round((new Date(startIso).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return null;
  if (diffMin < 60) return t("staffToday.inMinutes", { count: diffMin });
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0
    ? t("staffToday.inHoursMinutes", { hours: h, minutes: m })
    : t("staffToday.inHours", { hours: h });
}

function dayLabel(
  iso: string,
  locale: string,
  todayStr: string,
  t: (key: string) => string,
): string {
  const dateStr = iso.slice(0, 10);
  const d = new Date(iso);
  if (dateStr === todayStr) {
    return `${t("staffToday.todayBadgeShort")} · ${d.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
    })}`;
  }
  return d.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function rowAction(
  status: string,
  arrivalTrackingEnabled: boolean,
  t: (key: string) => string,
): string {
  if (status === "completed" || status === "pending_completion") {
    return t("staffToday.rowView");
  }
  if (status === "arrived" || status === "in_progress") {
    return t("staffToday.rowOpen");
  }
  if (status === "confirmed" && arrivalTrackingEnabled) {
    return t("staffToday.rowPrepare");
  }
  return t("staffToday.rowOpen");
}

function statusBadge(
  status: string,
  colors: ThemeColors,
  t: (key: string) => string,
): { label: string; bg: string; fg: string } {
  switch (status) {
    case "arrived":
      return {
        label: t("staffStatus.arrived"),
        bg: "#CFFAFE",
        fg: "#0E7490",
      };
    case "in_progress":
      return {
        label: t("staffStatus.in_progress"),
        bg: colors.primarySurface,
        fg: colors.primary,
      };
    case "confirmed":
      return {
        label: t("staffStatus.confirmed"),
        bg: "#D1FAE5",
        fg: "#047857",
      };
    case "pending":
      return {
        label: t("staffStatus.pending"),
        bg: colors.warningMuted,
        fg: colors.warning,
      };
    case "completed":
      return {
        label: t("staffStatus.completed"),
        bg: colors.bg,
        fg: colors.textMuted,
      };
    case "pending_completion":
      return {
        label: t("staffStatus.pending_completion"),
        bg: colors.warningMuted,
        fg: colors.warning,
      };
    default:
      return {
        label: t("staffToday.upcoming"),
        bg: colors.bg,
        fg: colors.textMuted,
      };
  }
}

function estimateCommission(
  appts: StaffAppointment[],
  servicesById: Map<string, StaffService>,
): number {
  const active = new Set([
    "confirmed",
    "pending",
    "offered",
    "arrived",
    "in_progress",
  ]);
  let commission = 0;
  for (const a of appts) {
    if (!active.has(a.status)) continue;
    const svc = servicesById.get(a.service.id);
    const type = svc?.offered_commission_type ?? svc?.staff_commission_type;
    const value = svc?.offered_commission_value ?? svc?.staff_commission_value ?? 0;
    const price = a.price;
    if (type === "percentage") commission += (price * value) / 100;
    else if (type === "fixed") commission += value;
  }
  return commission;
}

function clientInitials(first: string, last: string): string {
  return `${(first[0] ?? "").toUpperCase()}${(last[0] ?? "").toUpperCase()}` || "?";
}

export default function StaffTodayScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuthContext();
  const { tenant } = useTenantContext();
  const { data: staffSelf } = useStaffSelf();
  const settings = useBusinessSettings(tenant?.businessId ?? "");
  const today = toIsoDateLocal(new Date());
  const locale = localeForLanguage(i18n.language);

  /** Rolling 7-day window from today (web parity). */
  const weekFrom = today;
  const weekTo = useMemo(() => addDaysIso(today, 6), [today]);
  const month = useMemo(() => calendarMonthRange(), []);

  const weekQ = useStaffAppointments(weekFrom, weekTo, 100);
  const offersQ = useStaffOfferedAppointments();
  const servicesQ = useStaffServices();
  const trainingQ = useStaffTraining();
  const perfQ = useMyPerformanceRange(month.from, month.to);
  const updateStatus = useUpdateStaffAppointmentStatus();
  const respondOffer = useRespondToAppointmentOffer();
  const markArrived = useMarkArrived();
  const markNotesReviewed = useMarkNotesReviewed();
  const arrivalTrackingEnabled =
    settings.data?.settings?.enable_arrival_tracking === true;

  const [selected, setSelected] = useState<StaffAppointment | null>(null);
  const [offerBusyId, setOfferBusyId] = useState<string | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);

  const currency =
    settings.data?.settings?.currency_code ??
    servicesQ.data?.[0]?.currency_code ??
    "EUR";

  const displayName =
    staffSelf?.display_name?.trim() ||
    (staffSelf
      ? `${staffSelf.first_name} ${staffSelf.last_name}`.trim()
      : null) ||
    user?.email?.split("@")[0] ||
    t("staffToday.fallbackName");

  const greeting = t(greetingKeyForHour(new Date().getHours()));

  const weekAppts = useMemo(
    () =>
      [...(weekQ.data ?? [])]
        .filter((a) => a.status !== "cancelled")
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
    [weekQ.data],
  );

  const todayAppts = useMemo(
    () => weekAppts.filter((a) => a.starts_at.slice(0, 10) === today),
    [weekAppts, today],
  );

  const upcomingAppts = useMemo(
    () =>
      weekAppts.filter((a) => {
        const day = a.starts_at.slice(0, 10);
        if (a.status === "completed") return false;
        if (day > today) return true;
        if (day === today && a.status !== "no_show") return true;
        return false;
      }),
    [weekAppts, today],
  );

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return (
      todayAppts.find(
        (a) =>
          a.status === "confirmed" ||
          a.status === "arrived" ||
          a.status === "in_progress" ||
          (new Date(a.starts_at) > now && a.status !== "completed"),
      ) ?? null
    );
  }, [todayAppts]);

  const clientsToReview = useMemo(
    () =>
      todayAppts.filter((a) => {
        if (a.notes_reviewed_at) return false;
        if (a.status === "cancelled" || a.status === "completed") return false;
        const hasNotes = Boolean(a.notes?.trim());
        const hasIntake =
          !!a.intake_answers && Object.keys(a.intake_answers).length > 0;
        return hasNotes || hasIntake;
      }),
    [todayAppts],
  );

  const pendingOffers = offersQ.data ?? [];
  const services = servicesQ.data ?? [];
  const acceptedServices = services.filter(
    (s) => s.assignment_status === "accepted",
  );
  const pendingServiceOffers = services.filter(
    (s) => s.assignment_status === "pending",
  );
  const servicesById = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [services],
  );

  const trainingItems = useMemo(
    () => (trainingQ.data ?? []).filter((item) => Boolean(item.redemption_id)),
    [trainingQ.data],
  );

  const perf = perfQ.data ?? null;
  const hasSchedule = (staffSelf?.working_hours ?? []).some((d) => d.is_working);
  const hasAcceptedServices = acceptedServices.length > 0;
  const attentionCount =
    pendingOffers.length + pendingServiceOffers.length + clientsToReview.length;

  const arrivedCount = todayAppts.filter((a) => a.status === "arrived").length;
  const upcomingTodayCount = todayAppts.filter(
    (a) =>
      a.status !== "completed" &&
      a.status !== "no_show" &&
      new Date(a.starts_at) > new Date(),
  ).length;
  const scheduledHoursToday =
    todayAppts.reduce((sum, a) => sum + (a.service.duration_minutes ?? 0), 0) /
    60;
  const scheduledHoursWeek =
    weekAppts.reduce((sum, a) => sum + (a.service.duration_minutes ?? 0), 0) / 60;
  const estimatedCommissionToday = useMemo(
    () => estimateCommission(todayAppts, servicesById),
    [todayAppts, servicesById],
  );

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const projectedRevenue = perf
    ? projectMonthEnd(perf.revenue, dayOfMonth, daysInMonth)
    : null;

  const untilLabel = nextAppointment
    ? minutesUntilLabel(nextAppointment.starts_at, t)
    : null;

  function handleStartNext() {
    const next = todayAppts
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

  function handleOffer(
    offer: StaffAppointment,
    response: "accept" | "decline",
  ) {
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
      weekQ.refetch(),
      offersQ.refetch(),
      servicesQ.refetch(),
      trainingQ.refetch(),
      perfQ.refetch(),
    ]);
  }

  const refreshing =
    weekQ.isRefetching ||
    offersQ.isRefetching ||
    servicesQ.isRefetching ||
    trainingQ.isRefetching ||
    perfQ.isRefetching;

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={`${greeting}, ${displayName}`}
        subtitle={formatDateLong(new Date(), i18n.language)}
        displayTitle
        rightSlot={
          <Pressable
            style={styles.scanBtn}
            onPress={() => setVoucherOpen(true)}>
            <Ionicons name="qr-code-outline" size={14} color={colors.primary} />
            <Text style={styles.scanBtnText}>{t("staffToday.scan")}</Text>
          </Pressable>
        }
      />

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
        {/* ── NEXT APPOINTMENT ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>{t("staffToday.nextAppt")}</Text>
            </View>
            {untilLabel ? (
              <View style={styles.untilPill}>
                <Text style={styles.untilPillText}>{untilLabel}</Text>
              </View>
            ) : null}
          </View>

          {weekQ.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : !nextAppointment ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="checkmark-circle-outline"
                size={32}
                color={colors.textDim}
              />
              <Text style={styles.emptyTitle}>{t("staffToday.emptyNoneTitle")}</Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <View style={styles.nextHeroRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {clientInitials(
                      nextAppointment.client.first_name,
                      nextAppointment.client.last_name,
                    )}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.nextClient} numberOfLines={1}>
                    {clientDisplayName(
                      nextAppointment.client.first_name,
                      nextAppointment.client.last_name,
                    )}
                  </Text>
                  <Text style={styles.nextMeta} numberOfLines={1}>
                    {nextAppointment.service.name} ·{" "}
                    {formatTime(nextAppointment.starts_at)} ·{" "}
                    {nextAppointment.service.duration_minutes}m
                  </Text>
                  <View style={styles.nextMetaRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text style={styles.nextMetaHint}>
                      {nextAppointment.notes_reviewed_at
                        ? t("staffToday.notesReviewed")
                        : t("staffToday.notesNotReviewed")}
                    </Text>
                  </View>
                </View>
              </View>

              {arrivalTrackingEnabled ? (
                <ArrivalStepper
                  status={nextAppointment.status}
                  isMarkingArrived={markArrived.isPending}
                  onMarkArrived={() =>
                    markArrived.mutate(nextAppointment.id, {
                      onError: (err: Error) =>
                        toast.error(
                          t("staffToday.error"),
                          err.message || t("staffToday.toastArrivedError"),
                        ),
                    })
                  }
                />
              ) : (
                <Pressable
                  style={[
                    styles.primaryBtn,
                    updateStatus.isPending && styles.disabled,
                  ]}
                  disabled={updateStatus.isPending}
                  onPress={handleStartNext}>
                  <Ionicons name="play" size={14} color="#fff" />
                  <Text style={styles.primaryBtnText}>
                    {t("staffToday.startNext")}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={styles.primaryBtn}
                onPress={() => setSelected(nextAppointment)}>
                <Text style={styles.primaryBtnText}>
                  {t("staffToday.openAppointment")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.outlineBtn}
                onPress={() =>
                  router.push("/(app)/staff/(tabs)/clients" as Href)
                }>
                <Text style={styles.outlineBtnText}>
                  {t("staffToday.viewClientProfile")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <OnboardingBanner
          hasSchedule={hasSchedule}
          hasAcceptedServices={hasAcceptedServices}
          pendingOfferCount={pendingServiceOffers.length}
        />

        {/* ── THIS WEEK'S SCHEDULE ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>{t("staffToday.weekSchedule")}</Text>
              <HelpBubble section="today-schedule" />
            </View>
            <Pressable
              onPress={() =>
                router.push("/(app)/staff/(tabs)/calendar" as Href)
              }>
              <Text style={styles.linkText}>{t("staffToday.viewFullSchedule")}</Text>
            </Pressable>
          </View>

          {weekQ.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : weekQ.isError ? (
            <Text style={styles.emptyText}>{t("staffToday.errorLoad")}</Text>
          ) : upcomingAppts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="checkmark-circle-outline"
                size={32}
                color={colors.textDim}
              />
              <Text style={styles.emptyTitle}>{t("staffToday.emptyNoneTitle")}</Text>
              <Text style={styles.emptyText}>{t("staffToday.emptyNoneBody")}</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {upcomingAppts.slice(0, 6).map((a) => {
                const badge = statusBadge(a.status, colors, t);
                return (
                  <View key={a.id} style={styles.scheduleRow}>
                    <View style={styles.scheduleTimeCol}>
                      <Text style={styles.scheduleDay}>
                        {dayLabel(a.starts_at, locale, today, t)}
                      </Text>
                      <Text style={styles.scheduleTime}>
                        {formatTime(a.starts_at)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.scheduleClient} numberOfLines={1}>
                        {clientDisplayName(
                          a.client.first_name,
                          a.client.last_name,
                        )}
                      </Text>
                      <Text style={styles.scheduleService} numberOfLines={1}>
                        {a.service.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: badge.bg },
                      ]}>
                      <Text style={[styles.statusPillText, { color: badge.fg }]}>
                        {badge.label}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.rowActionBtn}
                      onPress={() => setSelected(a)}>
                      <Text style={styles.rowActionText}>
                        {rowAction(a.status, arrivalTrackingEnabled, t)}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
              <Text style={styles.weekFooter}>
                {t("staffToday.weekFooter", {
                  count: weekAppts.length,
                  hours: scheduledHoursWeek.toFixed(0),
                })}
              </Text>
            </View>
          )}
        </View>

        {/* ── YOUR WORK ── */}
        {perf ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("staffToday.yourWork")}</Text>
              <Pressable
                onPress={() =>
                  router.push("/(app)/staff/(tabs)/performance" as Href)
                }>
                <Text style={styles.linkText}>
                  {t("staffToday.viewPerformance")}
                </Text>
              </Pressable>
            </View>
            <View style={styles.workGrid}>
              <View style={styles.workItem}>
                <Text style={styles.workLabel}>{t("staffToday.thisWeek")}</Text>
                <Text style={styles.workValue}>
                  {t("staffToday.weekApptsCount", { count: weekAppts.length })}
                </Text>
              </View>
              <View style={styles.workItem}>
                <Text style={styles.workLabel}>{t("staffToday.thisMonth")}</Text>
                <Text style={styles.workValue}>
                  {money(perf.revenue, currency)}
                  {projectedRevenue != null &&
                  projectedRevenue > perf.revenue ? (
                    <Text style={styles.workProj}>
                      {" "}
                      ~{money(projectedRevenue, currency)}
                    </Text>
                  ) : null}
                </Text>
                <Text style={styles.workHint}>{t("staffToday.serviceValue")}</Text>
              </View>
              <View style={styles.workItem}>
                <Text style={styles.workLabel}>{"\u00a0"}</Text>
                <Text style={styles.workValue}>
                  {money(perf.commission_amount, currency)}
                </Text>
                <Text style={styles.workHint}>
                  {t("staffToday.commissionEarned")}
                </Text>
              </View>
              <View style={styles.workItem}>
                <Text style={styles.workLabel}>{t("staffToday.avgRating")}</Text>
                <Text style={styles.workValue}>
                  {perf.avg_rating > 0
                    ? `${perf.avg_rating.toFixed(1)} ★`
                    : t("staffToday.noReviewsYet")}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* My Services */}
        {acceptedServices.length > 0 ? (
          <View style={styles.block}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionMuted}>{t("staffToday.myServices")}</Text>
              <Pressable
                onPress={() =>
                  router.push("/(app)/staff/(tabs)/services" as Href)
                }>
                <Text style={styles.linkText}>{t("staffToday.seeAll")}</Text>
              </Pressable>
            </View>
            <View style={styles.svcGrid}>
              {acceptedServices.slice(0, 6).map((svc) => {
                const type =
                  svc.offered_commission_type ?? svc.staff_commission_type;
                const value =
                  svc.offered_commission_value ?? svc.staff_commission_value;
                return (
                  <Pressable
                    key={svc.id}
                    style={styles.svcChip}
                    onPress={() =>
                      router.push("/(app)/staff/(tabs)/services" as Href)
                    }>
                    <Text style={styles.svcName} numberOfLines={1}>
                      {svc.name}
                    </Text>
                    <Text style={styles.svcMeta}>
                      {svc.duration_minutes}m ·{" "}
                      {money(svc.effective_price ?? svc.price, currency)}
                    </Text>
                    {type && type !== "none" && value != null ? (
                      <Text style={styles.svcComm}>
                        {commissionLabel(type, value, currency)}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* My Training */}
        {trainingItems.length > 0 ? (
          <View style={styles.block}>
            <View style={styles.sectionHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.sectionMuted}>{t("staffToday.myTraining")}</Text>
                <HelpBubble section="my-training" />
              </View>
              <Pressable
                onPress={() =>
                  router.push("/(app)/staff/(tabs)/training" as Href)
                }>
                <Text style={styles.linkText}>{t("staffToday.seeAll")}</Text>
              </Pressable>
            </View>
            {trainingItems.slice(0, 4).map((item) => {
              const total = item.sessions_total ?? 0;
              const used = item.sessions_used ?? 0;
              const pct = total > 0 ? Math.round((used / total) * 100) : 0;
              const done =
                item.status === "completed" || (total > 0 && used >= total);
              const title =
                item.offer_title ||
                item.course?.title ||
                t("staffTraining.fallbackTitle");
              return (
                <View key={item.offer_id} style={styles.trainingRow}>
                  <View style={styles.trainingIcon}>
                    <Ionicons
                      name="book-outline"
                      size={14}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.trainingTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    {total > 0 ? (
                      <View style={styles.trainingProgress}>
                        <View style={styles.progressTrack}>
                          <View
                            style={[styles.progressFill, { width: `${pct}%` }]}
                          />
                        </View>
                        <Text style={styles.trainingPct}>
                          {used}/{total}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {done ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.success}
                    />
                  ) : item.redemption_id ? (
                    <Pressable
                      style={styles.trainingContinue}
                      onPress={() =>
                        router.push(
                          `/(app)/staff/(tabs)/training/${item.redemption_id}` as Href,
                        )
                      }>
                      <Ionicons name="play" size={12} color={colors.primary} />
                      <Text style={styles.trainingContinueText}>
                        {t("staffTraining.continue")}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* ── NEEDS YOUR ATTENTION ── */}
        {attentionCount > 0 ? (
          <View style={styles.attentionCard}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="notifications" size={16} color={colors.warning} />
              <Text style={styles.attentionTitle}>
                {t("staffToday.needsAttention")}
              </Text>
              <View style={styles.amberBadge}>
                <Text style={styles.amberBadgeText}>{attentionCount}</Text>
              </View>
              <HelpBubble section="pending-tasks" />
            </View>

            {pendingServiceOffers.length > 0 ? (
              <Pressable
                style={styles.attentionInner}
                onPress={() =>
                  router.push("/(app)/staff/(tabs)/services" as Href)
                }>
                <Ionicons name="sparkles" size={16} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerService}>
                    {t("staffToday.serviceOffer", {
                      count: pendingServiceOffers.length,
                    })}
                  </Text>
                  <Text style={styles.offerMeta}>
                    {t("staffToday.serviceOfferHint")}
                  </Text>
                </View>
                <Text style={styles.amberCta}>{t("staffToday.review")}</Text>
              </Pressable>
            ) : null}

            {pendingOffers.map((offer) => {
              const isReferral = !!offer.referral_staff_id;
              const busy = offerBusyId === offer.id || respondOffer.isPending;
              return (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerTitleRow}>
                    <Text style={styles.offerService} numberOfLines={1}>
                      {offer.service.name}
                    </Text>
                    {isReferral ? (
                      <View style={styles.refBadge}>
                        <Text style={styles.refBadgeText}>
                          {t("staffToday.referral")}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.offerMeta}>
                    {clientDisplayName(
                      offer.client.first_name,
                      offer.client.last_name,
                    )}{" "}
                    · {formatTime(offer.starts_at)} ·{" "}
                    {money(offer.price, currency)}
                  </Text>
                  <View style={styles.offerActions}>
                    <Pressable
                      style={[styles.declineOffer, busy && styles.disabled]}
                      disabled={busy}
                      onPress={() => handleOffer(offer, "decline")}>
                      <Text style={styles.declineOfferText}>
                        {t("staffToday.decline")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.acceptOffer, busy && styles.disabled]}
                      disabled={busy}
                      onPress={() => handleOffer(offer, "accept")}>
                      <Text style={styles.acceptOfferText}>
                        {t("staffToday.accept")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {clientsToReview.length > 0 ? (
              <View style={styles.attentionInnerCol}>
                <View style={styles.attentionInnerTop}>
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={colors.warning}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerService}>
                      {t("staffToday.clientsToReview", {
                        count: clientsToReview.length,
                      })}
                    </Text>
                    <Text style={styles.offerMeta}>
                      {t("staffToday.toReview")}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.rowActionBtn}
                    onPress={() => setReviewPanelOpen((v) => !v)}>
                    <Text style={styles.rowActionText}>
                      {reviewPanelOpen
                        ? t("staffToday.hide")
                        : t("staffToday.review")}
                    </Text>
                  </Pressable>
                </View>
                {reviewPanelOpen ? (
                  <View style={styles.reviewList}>
                    {clientsToReview.map((a) => (
                      <View key={a.id} style={styles.reviewRow}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.reviewName} numberOfLines={1}>
                            {clientDisplayName(
                              a.client.first_name,
                              a.client.last_name,
                            )}{" "}
                            · {a.service.name}
                          </Text>
                          {a.notes ? (
                            <Text style={styles.reviewNotes} numberOfLines={1}>
                              {a.notes}
                            </Text>
                          ) : null}
                        </View>
                        <Pressable
                          disabled={markNotesReviewed.isPending}
                          onPress={() =>
                            markNotesReviewed.mutate(a.id, {
                              onError: (err: Error) =>
                                toast.error(t("staffToday.error"), err.message),
                            })
                          }>
                          <Text style={styles.linkText}>
                            {t("staffToday.markNotesReviewed")}
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── TODAY STATS ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons
              name="clipboard-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>{t("staffToday.todayStats")}</Text>
          </View>
          <View style={styles.statStrip}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>
                {weekQ.isLoading ? "—" : String(todayAppts.length)}
              </Text>
              <Text style={styles.statLabel}>
                {t("staffToday.statAppointments")}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>
                {weekQ.isLoading ? "—" : `${scheduledHoursToday.toFixed(0)}h`}
              </Text>
              <Text style={styles.statLabel}>
                {t("staffToday.statScheduled")}
              </Text>
            </View>
            {arrivalTrackingEnabled ? (
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: "#0891B2" }]}>
                  {weekQ.isLoading ? "—" : String(arrivedCount)}
                </Text>
                <Text style={styles.statLabel}>
                  {t("staffToday.statArrived")}
                </Text>
              </View>
            ) : null}
            <View style={styles.statCell}>
              <Text style={styles.statValue}>
                {weekQ.isLoading ? "—" : String(upcomingTodayCount)}
              </Text>
              <Text style={styles.statLabel}>
                {t("staffToday.statUpcoming")}
              </Text>
            </View>
          </View>
        </View>

        {/* ── ESTIMATED COMMISSION ── */}
        <View style={styles.commissionCard}>
          <View style={styles.trainingIcon}>
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workHint}>
              {t("staffToday.estimatedCommissionToday")}
            </Text>
            <Text style={styles.workValue}>
              {money(estimatedCommissionToday, currency)}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              router.push(
                "/(app)/staff/(tabs)/performance?tab=earnings" as Href,
              )
            }>
            <Text style={styles.linkText}>{t("staffToday.viewEarnings")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppointmentStatusSheet
        appointment={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
      <VoucherScanSheet
        visible={voucherOpen}
        onClose={() => setVoucherOpen(false)}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40, gap: 16 },
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
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      gap: 8,
    },
    cardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    untilPill: {
      backgroundColor: colors.primarySurface,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    untilPillText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
    nextHeroRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
    nextClient: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    nextMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    nextMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
    },
    nextMetaHint: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    outlineBtn: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      backgroundColor: colors.card,
    },
    outlineBtnText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    disabled: { opacity: 0.55 },
    scheduleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexWrap: "wrap",
    },
    scheduleTimeCol: { minWidth: 72 },
    scheduleDay: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    scheduleTime: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    scheduleClient: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    scheduleService: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
      fontFamily: ownerFonts.regular,
    },
    statusPill: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    rowActionBtn: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    rowActionText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    weekFooter: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
      fontFamily: ownerFonts.regular,
    },
    workGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    workItem: { minWidth: "40%", flexGrow: 1 },
    workLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    workValue: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      marginTop: 2,
      fontFamily: ownerFonts.bold,
    },
    workProj: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.primary,
      fontFamily: ownerFonts.medium,
    },
    workHint: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    block: { gap: 8 },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    sectionMuted: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontFamily: ownerFonts.bold,
    },
    svcGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    svcChip: {
      width: "48%",
      flexGrow: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.card,
      padding: 12,
    },
    svcName: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    svcMeta: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    svcComm: {
      fontSize: 10,
      color: colors.primary,
      marginTop: 4,
      fontFamily: ownerFonts.medium,
    },
    trainingRow: {
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
    trainingIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    trainingTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    trainingProgress: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
    },
    trainingPct: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    trainingContinue: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    trainingContinueText: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    progressTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.bg,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    attentionCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#FCD34D",
      backgroundColor: colors.warningMuted,
      padding: 14,
      gap: 10,
    },
    attentionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#92400E",
      fontFamily: ownerFonts.bold,
      flexShrink: 1,
    },
    amberBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#F59E0B",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    amberBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
    attentionInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FDE68A",
      padding: 12,
    },
    attentionInnerCol: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FDE68A",
      padding: 12,
      gap: 8,
    },
    attentionInnerTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    amberCta: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.warning,
      fontFamily: ownerFonts.bold,
    },
    offerCard: {
      borderWidth: 1,
      borderColor: "#DDD6FE",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
    },
    offerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
      flexWrap: "wrap",
    },
    offerService: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    refBadge: {
      borderRadius: 999,
      backgroundColor: colors.primarySurface,
      borderWidth: 1,
      borderColor: colors.primary + "44",
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    refBadgeText: {
      fontSize: 10,
      color: colors.primary,
      fontFamily: ownerFonts.medium,
    },
    offerMeta: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    offerActions: { flexDirection: "row", gap: 8, marginTop: 10 },
    declineOffer: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    declineOfferText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.semiBold,
    },
    acceptOffer: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      backgroundColor: "#7C3AED",
      alignItems: "center",
      justifyContent: "center",
    },
    acceptOfferText: {
      fontSize: 12,
      color: "#fff",
      fontFamily: ownerFonts.semiBold,
    },
    reviewList: {
      width: "100%",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#FDE68A",
      gap: 8,
    },
    reviewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    reviewName: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    reviewNotes: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    statStrip: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 12,
    },
    statCell: { minWidth: 64, flexGrow: 1 },
    statValue: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    commissionCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
    },
    linkText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    emptyBox: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      borderRadius: 14,
      padding: 24,
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    emptyText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
      fontFamily: ownerFonts.regular,
    },
  });
}
