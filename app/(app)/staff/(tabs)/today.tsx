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
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
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
import { commissionLabel } from "@/lib/commissionLabel";
import {
  clientDisplayName,
  formatDateLong,
  formatTime,
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

function greetingForHour(h: number): string {
  if (h < 12) return "Bonjour";
  if (h < 17) return "Bon après-midi";
  return "Bonsoir";
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
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
  const { i18n } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuthContext();
  const { tenant } = useTenantContext();
  const { data: staffSelf } = useStaffSelf();
  const settings = useBusinessSettings(tenant?.businessId ?? "");
  const today = toIsoDateLocal(new Date());

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return toIsoDateLocal(d);
  }, []);
  const weekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (6 - d.getDay()));
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
  const perfQ = useMyPerformanceRange(month.from, month.to);
  const updateStatus = useUpdateStaffAppointmentStatus();
  const respondOffer = useRespondToAppointmentOffer();

  const [selected, setSelected] = useState<StaffAppointment | null>(null);
  const [offerBusyId, setOfferBusyId] = useState<string | null>(null);

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
    "là";

  const greeting = greetingForHour(new Date().getHours());

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
      toast.warning("Aucun RDV", "Pas de prochain rendez-vous à démarrer.");
      return;
    }
    updateStatus.mutate(
      { appointmentId: next.id, status: "in_progress" },
      {
        onSuccess: () =>
          toast.success("Démarré", `${next.service.name} en cours.`),
        onError: (err: Error) =>
          toast.error("Erreur", err.message || "Impossible de démarrer"),
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
            "Offre",
            response === "accept" ? "Rendez-vous accepté." : "Offre refusée.",
          ),
        onError: (err: Error) =>
          toast.error("Erreur", err.message || "Action impossible"),
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
      perfQ.refetch(),
    ]);
  }

  const refreshing =
    todayQ.isRefetching ||
    weekQ.isRefetching ||
    pastQ.isRefetching ||
    offersQ.isRefetching ||
    servicesQ.isRefetching ||
    perfQ.isRefetching;

  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar
        title={`${greeting}, ${displayName}`}
        subtitle={formatDateLong(new Date(), i18n.language)}
        displayTitle
        rightSlot={
          <Pressable
            style={[
              styles.startBtn,
              updateStatus.isPending && styles.disabled,
            ]}
            disabled={updateStatus.isPending}
            onPress={handleStartNext}>
            <Ionicons name="play" size={14} color="#fff" />
            <Text style={styles.startBtnText}>Démarrer</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={ownerColors.primary}
          />
        }>
        {/* Overview stats */}
        <View style={styles.statsGrid}>
          <StatTile
            label="Clients du jour"
            value={todayQ.isLoading ? "—" : String(todayAppts.length)}
            hint={`${remaining} restant${remaining === 1 ? "" : "s"}`}
          />
          <StatTile
            label="Prochain RDV"
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
                : "Aucun aujourd'hui"
            }
          />
          <StatTile
            label="Cette semaine"
            value={String(weekTotal)}
            hint="rendez-vous"
          />
          {perf ? (
            <StatTile
              label="Note moy."
              value={perf.avg_rating > 0 ? perf.avg_rating.toFixed(1) : "—"}
              hint={
                perf.avg_rating > 0
                  ? "★".repeat(Math.round(perf.avg_rating))
                  : "Pas encore d'avis"
              }
            />
          ) : (
            <StatTile label="Note moy." value="—" hint="Ce mois" />
          )}
        </View>

        <OnboardingBanner
          hasSchedule={hasSchedule}
          hasAcceptedServices={hasAcceptedServices}
          pendingOfferCount={pendingServiceOffers.length}
        />

        {/* Appointment offers */}
        {pendingOffers.length > 0 ? (
          <View style={styles.block}>
            <View style={styles.blockHeader}>
              <Ionicons
                name="notifications-outline"
                size={16}
                color="#7C3AED"
              />
              <Text style={styles.blockTitle}>Offres de RDV</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingOffers.length}</Text>
              </View>
            </View>
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
                          <Text style={styles.refBadgeText}>Parrainage</Text>
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
                      <Text style={styles.declineOfferText}>Refuser</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.acceptOffer, busy && styles.disabled]}
                      disabled={busy}
                      onPress={() => handleOffer(offer, "accept")}>
                      <Text style={styles.acceptOfferText}>Accepter</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Monthly performance */}
        {perf ? (
          <View style={styles.perfGrid}>
            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>CA du mois</Text>
              <Text style={styles.perfValue}>
                {money(perf.revenue, currency)}
              </Text>
              {projectedRevenue != null && projectedRevenue > perf.revenue ? (
                <Text style={styles.perfProj}>
                  ~{money(projectedRevenue, currency)} projeté
                </Text>
              ) : null}
            </View>
            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>Commission</Text>
              <Text style={styles.perfValue}>
                {money(perf.commission_amount, currency)}
              </Text>
              {projectedCommission != null &&
              projectedCommission > perf.commission_amount ? (
                <Text style={styles.perfProj}>
                  ~{money(projectedCommission, currency)} projeté
                </Text>
              ) : null}
            </View>
            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>Clients</Text>
              <Text style={styles.perfValue}>{perf.unique_clients}</Text>
              <Text style={styles.perfHint}>{perf.bookings} RDV</Text>
            </View>
            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>Complétion</Text>
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
              <Text style={styles.linkText}>Voir la performance</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={ownerColors.primary}
              />
            </Pressable>
          </View>
        ) : null}

        {/* Services snapshot */}
        {services.length > 0 ? (
          <View style={styles.block}>
            <View style={styles.blockHeaderBetween}>
              <Text style={styles.blockTitle}>Mes services</Text>
              <Pressable
                onPress={() =>
                  router.push("/(app)/staff/(tabs)/services" as Href)
                }>
                <Text style={styles.linkText}>Tout voir →</Text>
              </Pressable>
            </View>
            {pendingServiceOffers.length > 0 ? (
              <Pressable
                style={styles.amberBanner}
                onPress={() =>
                  router.push("/(app)/staff/(tabs)/services" as Href)
                }>
                <Text style={styles.amberText}>
                  {pendingServiceOffers.length} offre
                  {pendingServiceOffers.length > 1 ? "s" : ""} en attente
                </Text>
                <Text style={styles.amberCta}>Voir</Text>
              </Pressable>
            ) : null}
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

        {/* Today's appointments */}
        <View style={styles.block}>
          <View style={styles.blockHeaderBetween}>
            <Text style={styles.blockTitle}>RDV du jour</Text>
            <Pressable
              onPress={() =>
                router.push("/(app)/staff/(tabs)/calendar" as Href)
              }>
              <Text style={styles.linkText}>Agenda →</Text>
            </Pressable>
          </View>

          {todayQ.isLoading ? (
            <ActivityIndicator color={ownerColors.primary} />
          ) : todayQ.isError ? (
            <Text style={styles.emptyText}>
              Impossible de charger les rendez-vous.
            </Text>
          ) : todayAppts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {hasSchedule && hasAcceptedServices
                  ? "Tout est prêt"
                  : "Aucun rendez-vous"}
              </Text>
              <Text style={styles.emptyText}>
                {hasSchedule && hasAcceptedServices
                  ? "Les rendez-vous apparaîtront ici dès que des clients réserveront."
                  : "Profitez de votre journée libre."}
              </Text>
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

        {/* Recent past */}
        {pastAppts.length > 0 ? (
          <View style={styles.block}>
            <View style={styles.blockHeaderBetween}>
              <Text style={styles.blockTitle}>Récents (7 j)</Text>
              <Pressable
                onPress={() =>
                  router.push("/(app)/staff/(tabs)/calendar" as Href)
                }>
                <Text style={styles.linkText}>Agenda →</Text>
              </Pressable>
            </View>
            {pastAppts.map((a) => (
              <View key={a.id} style={styles.pastRow}>
                <View style={styles.pastTime}>
                  <Text style={styles.pastDate}>
                    {new Date(a.starts_at).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
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
                      ? "Fait"
                      : a.status === "no_show"
                        ? "No-show"
                        : a.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <AppointmentStatusSheet
        appointment={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ownerColors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statTile: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 14,
    padding: 12,
  },
  statLabel: {
    fontSize: 11,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: ownerColors.text,
    marginTop: 4,
    fontFamily: ownerFonts.bold,
  },
  statHint: {
    fontSize: 11,
    color: ownerColors.textDim,
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
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
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
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  refBadge: {
    borderRadius: 999,
    backgroundColor: ownerColors.primarySurface,
    borderWidth: 1,
    borderColor: ownerColors.primary + "44",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  refBadgeText: {
    fontSize: 10,
    color: ownerColors.primary,
    fontFamily: ownerFonts.medium,
  },
  offerMeta: {
    fontSize: 12,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.regular,
  },
  offerActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  declineOffer: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  declineOfferText: {
    fontSize: 12,
    color: ownerColors.textMuted,
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
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 14,
    padding: 12,
  },
  perfLabel: {
    fontSize: 11,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  perfValue: {
    fontSize: 20,
    fontWeight: "700",
    color: ownerColors.text,
    marginTop: 4,
    fontFamily: ownerFonts.bold,
  },
  perfProj: {
    fontSize: 11,
    color: ownerColors.primary,
    marginTop: 4,
    fontFamily: ownerFonts.medium,
  },
  perfHint: {
    fontSize: 11,
    color: ownerColors.textDim,
    marginTop: 4,
    fontFamily: ownerFonts.regular,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ownerColors.bg,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: ownerColors.primary,
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
    color: ownerColors.primary,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  amberBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  amberText: {
    fontSize: 12,
    color: "#92400E",
    fontFamily: ownerFonts.medium,
  },
  amberCta: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
    fontFamily: ownerFonts.bold,
  },
  svcGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  svcChip: {
    width: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    backgroundColor: ownerColors.card,
    padding: 10,
  },
  svcName: {
    fontSize: 13,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  svcMeta: {
    fontSize: 11,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  svcComm: {
    fontSize: 10,
    color: ownerColors.primary,
    marginTop: 4,
    fontFamily: ownerFonts.medium,
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: ownerColors.border,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
  },
  emptyText: {
    fontSize: 12,
    color: ownerColors.textMuted,
    textAlign: "center",
    marginTop: 6,
    fontFamily: ownerFonts.regular,
  },
  pastRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pastTime: { width: 72 },
  pastDate: {
    fontSize: 10,
    color: ownerColors.textDim,
    textTransform: "uppercase",
    fontFamily: ownerFonts.medium,
  },
  pastHour: {
    fontSize: 12,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  pastDivider: {
    width: 2,
    height: 28,
    borderRadius: 1,
    backgroundColor: ownerColors.border,
  },
  pastClient: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
  },
  pastService: {
    fontSize: 11,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.regular,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDone: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusNoShow: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.semiBold,
  },
  disabled: { opacity: 0.6 },
});
