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
import { OnboardingBanner } from "@/components/staff/OnboardingBanner";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { TodayAppointmentCard } from "@/components/staff/TodayAppointmentCard";
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
  formatDate,
  formatTime,
  localeForLanguage,
} from "@/lib/format";
import { toIsoDateLocal } from "@/lib/ownerCalendar";
import type { StaffAppointment } from "@/services/staff/appointments";

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

function greetingKeyForHour(h: number): "staffToday.morning" | "staffToday.afternoon" | "staffToday.evening" {
  if (h < 12) return "staffToday.morning";
  if (h < 17) return "staffToday.afternoon";
  return "staffToday.evening";
}

function StatTile({
  label,
  value,
  hint,
  styles,
}: {
  label: string;
  value: string;
  hint: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint} numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
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

  const weekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    const mondayOffset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + mondayOffset);
    return toIsoDateLocal(d);
  }, []);
  const weekEnd = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + mondayOffset + 6);
    return toIsoDateLocal(d);
  }, []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toIsoDateLocal(d);
  }, []);
  const past7Start = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toIsoDateLocal(d);
  }, []);
  const month = useMemo(() => calendarMonthRange(), []);

  const todayQ = useStaffAppointments(today, today, 50);
  const weekQ = useStaffAppointments(weekStart, weekEnd, 200);
  const pastQ = useStaffAppointments(past7Start, yesterday, 10);
  const offersQ = useStaffOfferedAppointments();
  const servicesQ = useStaffServices();
  const trainingQ = useStaffTraining();
  const perfQ = useMyPerformanceRange(month.from, month.to);
  const updateStatus = useUpdateStaffAppointmentStatus();
  const respondOffer = useRespondToAppointmentOffer();

  const [selected, setSelected] = useState<StaffAppointment | null>(null);
  const [offerBusyId, setOfferBusyId] = useState<string | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);

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

  const remaining = todayAppts.filter((a) =>
    ["pending", "confirmed"].includes(a.status),
  ).length;

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return (
      todayAppts.find(
        (a) =>
          new Date(a.starts_at) > now &&
          a.status !== "completed" &&
          a.status !== "cancelled",
      ) ?? null
    );
  }, [todayAppts]);

  const weekTotal = weekQ.data?.length ?? 0;
  const perf = perfQ.data ?? null;
  const pendingOffers = offersQ.data ?? [];
  const services = servicesQ.data ?? [];
  const acceptedServices = services.filter(
    (s) => s.assignment_status === "accepted",
  );
  const pendingServiceOffers = services.filter(
    (s) => s.assignment_status === "pending",
  );

  const pastAppts = useMemo(
    () =>
      [...(pastQ.data ?? [])]
        .filter((a) => a.status !== "cancelled")
        .sort(
          (a, b) =>
            new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
        ),
    [pastQ.data],
  );

  const weekDays = useMemo(() => {
    const allWeek = [...(weekQ.data ?? [])].filter(
      (a) => a.status !== "cancelled",
    );
    const locale = localeForLanguage(i18n.language);
    const days: {
      date: string;
      label: string;
      appts: StaffAppointment[];
    }[] = [];
    const anchor = new Date();
    const dayOfWeek = anchor.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    for (let i = 0; i < 7; i++) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + mondayOffset + i);
      const dateStr = toIsoDateLocal(d);
      const label = d.toLocaleDateString(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      days.push({
        date: dateStr,
        label,
        appts: allWeek
          .filter((a) => a.starts_at.slice(0, 10) === dateStr)
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
      });
    }
    return days;
  }, [weekQ.data, i18n.language]);

  const trainingItems = useMemo(() => {
    return (trainingQ.data ?? []).filter((item) => Boolean(item.redemption_id));
  }, [trainingQ.data]);

  const hasSchedule = (staffSelf?.working_hours ?? []).some((d) => d.is_working);
  const hasAcceptedServices = acceptedServices.length > 0;

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
  const projectedCommission = perf
    ? projectMonthEnd(perf.commission_amount, dayOfMonth, daysInMonth)
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
      todayQ.refetch(),
      weekQ.refetch(),
      pastQ.refetch(),
      offersQ.refetch(),
      servicesQ.refetch(),
      trainingQ.refetch(),
      perfQ.refetch(),
    ]);
  }

  const refreshing =
    todayQ.isRefetching ||
    weekQ.isRefetching ||
    pastQ.isRefetching ||
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
          <View style={styles.headerActions}>
            <Pressable
              style={styles.scanBtn}
              onPress={() => setVoucherOpen(true)}>
              <Ionicons name="qr-code-outline" size={14} color={colors.primary} />
              <Text style={styles.scanBtnText}>{t("staffToday.scan")}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.startBtn,
                updateStatus.isPending && styles.disabled,
              ]}
              disabled={updateStatus.isPending}
              onPress={handleStartNext}>
              <Ionicons name="play" size={14} color="#fff" />
              <Text style={styles.startBtnText}>{t("staffToday.startNext")}</Text>
            </Pressable>
          </View>
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
        {/* Pending tasks — top priority */}
        {pendingOffers.length > 0 || pendingServiceOffers.length > 0 ? (
          <View style={styles.pendingTasks}>
            <View style={styles.blockHeader}>
              <Ionicons name="notifications" size={16} color="#D97706" />
              <Text style={styles.pendingTitle}>{t("staffToday.pendingTasks")}</Text>
              <View style={styles.amberBadge}>
                <Text style={styles.amberBadgeText}>
                  {pendingOffers.length + pendingServiceOffers.length}
                </Text>
              </View>
            </View>

            {pendingServiceOffers.length > 0 ? (
              <Pressable
                style={styles.serviceOfferRow}
                onPress={() =>
                  router.push("/(app)/staff/(tabs)/services" as Href)
                }>
                <Ionicons name="sparkles" size={16} color="#D97706" />
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
                <Text style={styles.amberCta}>{t("staffToday.see")}</Text>
              </Pressable>
            ) : null}

            {pendingOffers.map((offer) => {
              const isReferral = !!offer.referral_staff_id;
              const busy = offerBusyId === offer.id || respondOffer.isPending;
              return (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.offerTitleRow}>
                      <Text style={styles.offerService}>
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
                  </View>
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
          </View>
        ) : null}

        <OnboardingBanner
          hasSchedule={hasSchedule}
          hasAcceptedServices={hasAcceptedServices}
          pendingOfferCount={pendingServiceOffers.length}
        />

        {/* Today's appointments */}
        <View style={styles.block}>
          <View style={styles.blockHeaderBetween}>
            <Text style={styles.blockTitle}>{t("staffToday.apptsToday")}</Text>
            <Pressable
              onPress={() =>
                router.push("/(app)/staff/(tabs)/calendar" as Href)
              }>
              <Text style={styles.linkText}>{t("staffToday.agendaLink")}</Text>
            </Pressable>
          </View>

          {todayQ.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : todayQ.isError ? (
            <Text style={styles.emptyText}>{t("staffToday.errorLoad")}</Text>
          ) : todayAppts.length === 0 ? (
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
            todayAppts.map((a) => (
              <TodayAppointmentCard
                key={a.id}
                appointment={a}
                onPress={setSelected}
              />
            ))
          )}
        </View>

        {/* This week — day by day (web parity) */}
        <View style={styles.block}>
          <View style={styles.blockHeaderBetween}>
            <Text style={styles.blockTitle}>{t("staffToday.thisWeekSection")}</Text>
            <Pressable
              onPress={() =>
                router.push("/(app)/staff/(tabs)/calendar" as Href)
              }>
              <Text style={styles.linkText}>{t("staffToday.agendaLink")}</Text>
            </Pressable>
          </View>
          {weekDays.map((day) => {
            const isToday = day.date === today;
            return (
              <View key={day.date} style={styles.weekDay}>
                <View style={styles.weekDayHeader}>
                  <Text
                    style={[
                      styles.weekDayLabel,
                      isToday && { color: colors.primary },
                    ]}>
                    {day.label}
                  </Text>
                  {isToday ? (
                    <View style={styles.todayPill}>
                      <Text style={styles.todayPillText}>
                        {t("staffToday.todayBadge")}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {day.appts.length === 0 ? (
                  <View style={styles.weekEmpty}>
                    <Text style={styles.weekEmptyText}>
                      {t("staffToday.noBookings")}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.weekAppts,
                      isToday && styles.weekApptsToday,
                    ]}>
                    {day.appts.map((a) => (
                      <Pressable
                        key={a.id}
                        style={styles.weekRow}
                        onPress={() => setSelected(a)}>
                        <Text style={styles.weekTime}>
                          {formatTime(a.starts_at)}
                        </Text>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.weekClient} numberOfLines={1}>
                            {clientDisplayName(
                              a.client.first_name,
                              a.client.last_name,
                            )}
                          </Text>
                          <Text style={styles.weekService} numberOfLines={1}>
                            {a.service.name}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            a.status === "completed" && styles.statusDone,
                            a.status === "in_progress" && styles.statusInProgress,
                            a.status === "no_show" && styles.statusNoShow,
                          ]}>
                          <Text style={styles.statusPillText}>
                            {a.status === "completed"
                              ? t("staffStatus.doneShort")
                              : a.status === "in_progress"
                                ? t("staffStatus.in_progress")
                                : a.status === "no_show"
                                  ? t("staffStatus.no_show")
                                  : t("staffToday.upcoming")}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Recent past */}
        {pastAppts.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.sectionMuted}>{t("staffToday.recentPast")}</Text>
            {pastAppts.map((a) => (
              <View key={a.id} style={styles.pastRow}>
                <View style={styles.pastTime}>
                  <Text style={styles.pastDate}>
                    {formatDate(a.starts_at, i18n.language)}
                  </Text>
                  <Text style={styles.pastHour}>{formatTime(a.starts_at)}</Text>
                </View>
                <View style={styles.pastDivider} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pastClient} numberOfLines={1}>
                    {clientDisplayName(
                      a.client.first_name,
                      a.client.last_name,
                    )}
                  </Text>
                  <Text style={styles.pastService} numberOfLines={1}>
                    {a.service.name}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    a.status === "completed" && styles.statusDone,
                    a.status === "no_show" && styles.statusNoShow,
                  ]}>
                  <Text style={styles.statusPillText}>
                    {a.status === "completed"
                      ? t("staffStatus.doneShort")
                      : t(`staffStatus.${a.status}`, {
                          defaultValue: a.status,
                        })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Overview stats */}
        <View style={styles.statsGrid}>
          <StatTile
            label={t("staffToday.todayClients")}
            value={todayQ.isLoading ? "—" : String(todayAppts.length)}
            hint={t("staffToday.remaining", { count: remaining })}
            styles={styles}
          />
          <StatTile
            label={t("staffToday.nextAppt")}
            value={
              todayQ.isLoading
                ? "—"
                : nextAppointment
                  ? formatTime(nextAppointment.starts_at)
                  : "—"
            }
            hint={
              nextAppointment
                ? nextAppointment.service.name
                : t("staffToday.noneToday")
            }
            styles={styles}
          />
          <StatTile
            label={t("staffToday.thisWeek")}
            value={String(weekTotal)}
            hint={t("staffToday.appointments")}
            styles={styles}
          />
          {perf ? (
            <StatTile
              label={t("staffToday.avgRating")}
              value={perf.avg_rating > 0 ? perf.avg_rating.toFixed(1) : "—"}
              hint={
                perf.avg_rating > 0
                  ? "★".repeat(Math.round(perf.avg_rating))
                  : t("staffToday.noReviewsYet")
              }
              styles={styles}
            />
          ) : (
            <StatTile
              label={t("staffToday.avgRating")}
              value="—"
              hint={t("staffToday.thisMonth")}
              styles={styles}
            />
          )}
        </View>

        {/* Monthly performance */}
        {perf ? (
          <View style={styles.perfGrid}>
            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>{t("staffToday.monthRevenue")}</Text>
              <Text style={styles.perfValue}>
                {money(perf.revenue, currency)}
              </Text>
              {projectedRevenue != null && projectedRevenue > perf.revenue ? (
                <Text style={styles.perfProj}>
                  {t("staffToday.projected", {
                    amount: money(projectedRevenue, currency),
                  })}
                </Text>
              ) : null}
            </View>
            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>{t("staffToday.commission")}</Text>
              <Text style={styles.perfValue}>
                {money(perf.commission_amount, currency)}
              </Text>
              {projectedCommission != null &&
              projectedCommission > perf.commission_amount ? (
                <Text style={styles.perfProj}>
                  {t("staffToday.projected", {
                    amount: money(projectedCommission, currency),
                  })}
                </Text>
              ) : null}
            </View>
            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>{t("staffToday.clients")}</Text>
              <Text style={styles.perfValue}>{perf.unique_clients}</Text>
              <Text style={styles.perfHint}>
                {t("staffToday.bookingsCount", { count: perf.bookings })}
              </Text>
            </View>
            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>{t("staffToday.completion")}</Text>
              <Text style={styles.perfValue}>
                {perf.completion_rate > 0
                  ? `${Math.round(perf.completion_rate * 100)}%`
                  : "—"}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(perf.completion_rate * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <Pressable
              style={styles.linkRow}
              onPress={() =>
                router.push("/(app)/staff/(tabs)/performance" as Href)
              }>
              <Text style={styles.linkText}>{t("staffToday.viewPerformance")}</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={colors.primary}
              />
            </Pressable>
          </View>
        ) : null}

        {/* Services snapshot */}
        {acceptedServices.length > 0 ? (
          <View style={styles.block}>
            <View style={styles.blockHeaderBetween}>
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
                      {svc.duration_minutes} min ·{" "}
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

        {/* My Training — web parity */}
        {trainingItems.length > 0 ? (
          <View style={styles.block}>
            <View style={styles.blockHeaderBetween}>
              <Text style={styles.sectionMuted}>{t("staffToday.myTraining")}</Text>
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
                            style={[
                              styles.progressFill,
                              { width: `${pct}%` },
                            ]}
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
  greetingBlock: {
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    fontFamily: ownerFonts.bold,
    letterSpacing: -0.3,
  },
  pendingTasks: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.warning,
    backgroundColor: colors.warningMuted,
    padding: 14,
    gap: 10,
    marginBottom: 4,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.warning,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: ownerFonts.bold,
  },
  amberBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warning,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  amberBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  serviceOfferRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 12,
  },
  disabled: { opacity: 0.55 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statTile: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
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
  block: { marginBottom: 16 },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  blockHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    fontFamily: ownerFonts.bold,
  },
  sectionMuted: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    fontFamily: ownerFonts.bold,
  },
  weekDay: { marginBottom: 12 },
  weekDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontFamily: ownerFonts.bold,
  },
  todayPill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  todayPillText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    fontFamily: ownerFonts.bold,
  },
  weekEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  weekEmptyText: {
    fontSize: 12,
    color: colors.textDim,
    fontFamily: ownerFonts.regular,
  },
  weekAppts: { gap: 6 },
  weekApptsToday: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 8,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  weekTime: {
    width: 44,
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    fontFamily: ownerFonts.bold,
  },
  weekClient: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    fontFamily: ownerFonts.semiBold,
  },
  weekService: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
    fontFamily: ownerFonts.regular,
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
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
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
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  offerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  offerService: {
    fontSize: 14,
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
    fontSize: 12,
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
  perfGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  perfCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  perfLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  perfValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
    fontFamily: ownerFonts.bold,
  },
  perfProj: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
    fontFamily: ownerFonts.medium,
  },
  perfHint: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 4,
    fontFamily: ownerFonts.regular,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bg,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  linkRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingTop: 4,
  },
  linkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  amberBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.warningMuted,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  amberText: {
    fontSize: 12,
    color: colors.warning,
    fontFamily: ownerFonts.medium,
  },
  amberCta: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.warning,
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
    padding: 10,
  },
  svcName: {
    fontSize: 13,
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
    marginTop: 6,
    fontFamily: ownerFonts.regular,
  },
  pastRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pastTime: { width: 72 },
  pastDate: {
    fontSize: 10,
    color: colors.textDim,
    textTransform: "uppercase",
    fontFamily: ownerFonts.medium,
  },
  pastHour: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    fontFamily: ownerFonts.bold,
  },
  pastDivider: {
    width: 2,
    height: 28,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  pastClient: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    fontFamily: ownerFonts.semiBold,
  },
  pastService: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: ownerFonts.regular,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDone: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusInProgress: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primary + "44",
  },
  statusNoShow: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    fontFamily: ownerFonts.semiBold,
  },
});
}

