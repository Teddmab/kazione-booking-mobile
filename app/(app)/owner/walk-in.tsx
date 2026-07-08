import { useRouter, type Href, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MonthCalendar } from "@/components/booking/MonthCalendar";
import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { WalkInStepBar } from "@/components/owner/WalkInStepBar";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import { invalidateOwnerClientQueries } from "@/lib/ownerClientQueries";
import { availabilityToDisplaySlots } from "@/lib/bookingSlots";
import { startOfToday } from "@/lib/dateUtils";
import { clientDisplayName, formatCurrency, formatDate, toIsoDate } from "@/lib/format";
import { createBooking, getAvailability } from "@/services/booking";
import { getClient, getClients } from "@/services/owner/clients";
import { getOwnerServices } from "@/services/owner/services";
import { getStaffList } from "@/services/owner/staff";
import type { ClientWithStats } from "@/types/owner";

const STEP_COUNT = 5;

export default function WalkInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{
    clientId?: string;
    clientName?: string;
    staffId?: string;
    staffName?: string;
  }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const [step, setStep] = useState(0);
  const [isGuest, setIsGuest] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [guestName, setGuestName] = useState("Client passage");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail] = useState("walkin@salon.local");

  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = startOfToday();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const clientId = params.clientId ? String(params.clientId) : null;
    if (!clientId || !businessId) return;

    let cancelled = false;
    void getClient(clientId)
      .then((detail) => {
        if (cancelled) return;
        setIsGuest(false);
        setSelectedClient({
          id: detail.id,
          first_name: detail.first_name,
          last_name: detail.last_name,
          email: detail.email,
          phone: detail.phone,
          appointment_count: detail.appointment_count,
          total_spent: detail.total_spent,
          last_visit: detail.last_visit,
        });
      })
      .catch(() => {
        if (cancelled || !params.clientName) return;
        setIsGuest(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.clientId, params.clientName, businessId]);

  useEffect(() => {
    const sid = params.staffId ? String(params.staffId) : null;
    if (sid) setStaffId(sid);
  }, [params.staffId]);

  const stepLabels = useMemo(
    () => [
      t("owner.walkInStepClient"),
      t("owner.walkInStepService"),
      t("owner.walkInStepStaff"),
      t("owner.walkInStepDateTime"),
      t("owner.walkInStepConfirm"),
    ],
    [t],
  );

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["owner-clients-walkin", businessId],
    queryFn: () => getClients(businessId, { limit: 100 }),
    enabled: !!businessId && !isGuest,
  });

  const filteredClients = useMemo(() => {
    const list = clientsData?.clients ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const name = clientDisplayName(c.first_name, c.last_name).toLowerCase();
      return (
        name.includes(q) ||
        (c.phone?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [clientsData, search]);

  const { data: services = [] } = useQuery({
    queryKey: ["owner-services", businessId],
    queryFn: () => getOwnerServices(businessId),
    enabled: !!businessId,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["owner-staff", businessId],
    queryFn: () => getStaffList(businessId),
    enabled: !!businessId,
  });

  const selectedService = services.find((s) => s.id === serviceId);

  const { data: availability, isLoading: slotsLoading } = useQuery({
    queryKey: ["walk-in-availability", businessId, serviceId, date, staffId],
    queryFn: () =>
      getAvailability({
        business_id: businessId,
        service_id: serviceId!,
        date,
        staff_id: staffId ?? undefined,
        payment_method: "later",
      }),
    enabled: !!businessId && !!serviceId && step === 3,
  });

  const slots = useMemo(
    () => availabilityToDisplaySlots(availability, staffId).filter((s) => s.available),
    [availability, staffId],
  );

  const bookMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-appointments", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-dashboard-kpis", businessId] });
      invalidateOwnerClientQueries(queryClient, businessId);
      toast.success(t("owner.walkInSuccessTitle"), t("owner.walkInSuccessMessage"), {
        onDismiss: () => router.back(),
      });
    },
    onError: (e: Error) => {
      toast.error(t("owner.walkInErrorTitle"), e.message);
    },
  });

  const clientLabel = isGuest
    ? guestName.trim()
    : selectedClient
      ? clientDisplayName(selectedClient.first_name, selectedClient.last_name)
      : "—";

  const canGoNext = (() => {
    if (step === 0) {
      return isGuest ? guestName.trim().length > 0 : !!selectedClient;
    }
    if (step === 1) return !!serviceId;
    if (step === 2) return true;
    if (step === 3) return !!time;
    // Step 5 = récapitulatif final → « Réserver » envoie la réservation (pas d'étape 6)
    if (step === 4) {
      return !!serviceId && !!time && !!selectedService;
    }
    return false;
  })();

  const goNext = () => {
    if (!canGoNext) return;
    if (step < STEP_COUNT - 1) {
      setStep((s) => s + 1);
      return;
    }
    submit();
  };

  const goBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  };

  const switchGuestMode = (guest: boolean) => {
    setIsGuest(guest);
    setSelectedClient(null);
    setSearch("");
  };

  const submit = () => {
    if (!serviceId || !time || !selectedService) return;
    const name = isGuest
      ? guestName.trim()
      : clientDisplayName(selectedClient!.first_name, selectedClient!.last_name);
    const email = isGuest
      ? guestEmail.trim() || "walkin@salon.local"
      : selectedClient?.email?.trim() || "walkin@salon.local";
    const phone = isGuest
      ? guestPhone.trim() || "+00000000"
      : selectedClient?.phone?.trim() || "+00000000";

    bookMutation.mutate({
      business_id: businessId,
      service_id: serviceId,
      staff_profile_id: staffId,
      date,
      time,
      client: { name, email, phone },
      payment_method: "later",
      locale: "fr",
    });
  };

  const footerLabel =
    step === STEP_COUNT - 1
      ? bookMutation.isPending
        ? t("owner.walkInBooking")
        : t("owner.walkInBook")
      : t("owner.walkInNext");

  return (
    <OwnerStackShell title={t("owner.walkInTitle")} subtitle={t("owner.walkInSub")}>
      <View style={styles.flex}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <WalkInStepBar currentStep={step} labels={stepLabels} />

          {step === 0 ? (
            <View style={styles.section}>
              <View style={styles.row}>
                <Pressable
                  style={[styles.chip, isGuest && styles.chipActive]}
                  onPress={() => switchGuestMode(true)}>
                  <Text style={[styles.chipText, isGuest && styles.chipTextActive]}>
                    {t("owner.walkInGuest")}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.chip, !isGuest && styles.chipActive]}
                  onPress={() => switchGuestMode(false)}>
                  <Text style={[styles.chipText, !isGuest && styles.chipTextActive]}>
                    {t("owner.walkInExisting")}
                  </Text>
                </Pressable>
              </View>

              {isGuest ? (
                <>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    style={styles.input}
                    value={guestName}
                    onChangeText={setGuestName}
                    placeholder="Client passage"
                  />
                  <Text style={styles.label}>Téléphone (optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    value={guestPhone}
                    onChangeText={setGuestPhone}
                    keyboardType="phone-pad"
                  />
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder={t("owner.walkInSearchClients")}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                  />
                  {clientsLoading ? (
                    <ActivityIndicator color={ownerColors.primary} style={styles.loader} />
                  ) : filteredClients.length === 0 ? (
                    <Text style={styles.empty}>{t("owner.walkInNoClients")}</Text>
                  ) : (
                    filteredClients.map((c) => (
                      <Pressable
                        key={c.id}
                        style={[
                          styles.clientRow,
                          selectedClient?.id === c.id && styles.clientRowActive,
                        ]}
                        onPress={() => setSelectedClient(c)}>
                        <Text style={styles.clientName}>
                          {clientDisplayName(c.first_name, c.last_name)}
                        </Text>
                        {c.phone ? <Text style={styles.clientSub}>{c.phone}</Text> : null}
                        {c.email ? <Text style={styles.clientSub}>{c.email}</Text> : null}
                      </Pressable>
                    ))
                  )}
                </>
              )}
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.section}>
              <Text style={styles.stepTitle}>{t("owner.walkInSelectService")}</Text>
              {services.map((s) => (
                <Pressable
                  key={s.id}
                  style={[styles.option, serviceId === s.id && styles.optionActive]}
                  onPress={() => {
                    setServiceId(s.id);
                    setTime(null);
                  }}>
                  <Text style={styles.optionText}>
                    {s.name} · {s.duration_minutes} min · {formatCurrency(s.price)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.section}>
              <Text style={styles.stepTitle}>{t("owner.walkInSelectStaff")}</Text>
              <Pressable
                style={[styles.option, staffId === null && styles.optionActive]}
                onPress={() => {
                  setStaffId(null);
                  setTime(null);
                }}>
                <Text style={styles.optionText}>{t("owner.walkInNoPreference")}</Text>
              </Pressable>
              {staffList.map((st) => (
                <Pressable
                  key={st.id}
                  style={[styles.option, staffId === st.id && styles.optionActive]}
                  onPress={() => {
                    setStaffId(st.id);
                    setTime(null);
                  }}>
                  <Text style={styles.optionText}>{st.display_name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.section}>
              <Text style={styles.stepTitle}>{t("owner.walkInSelectDate")}</Text>
              <View style={styles.calendarCard}>
                <MonthCalendar
                  month={calendarMonth}
                  selectedDate={date}
                  onSelectDate={(iso) => {
                    setDate(iso);
                    setTime(null);
                  }}
                  onPrevMonth={() =>
                    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
                  }
                  onNextMonth={() =>
                    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
                  }
                />
              </View>
              <Text style={styles.selectedDate}>{formatDate(date)}</Text>

              <Text style={[styles.label, styles.spaced]}>{t("owner.walkInSelectSlot")}</Text>
              {slotsLoading ? (
                <ActivityIndicator color={ownerColors.primary} style={styles.loader} />
              ) : slots.length === 0 ? (
                <Text style={styles.empty}>{t("owner.walkInNoSlots")}</Text>
              ) : (
                <View style={styles.slotGrid}>
                  {slots.map((sl) => (
                    <Pressable
                      key={sl.time}
                      style={[styles.slot, time === sl.time && styles.slotActive]}
                      onPress={() => setTime(sl.time)}>
                      <Text style={[styles.slotText, time === sl.time && styles.slotTextActive]}>
                        {sl.time}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.section}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Client · </Text>
                  {clientLabel}
                </Text>
                <Text style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Service · </Text>
                  {selectedService?.name}
                </Text>
                <Text style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Coiffeur·se · </Text>
                  {staffList.find((s) => s.id === staffId)?.display_name ?? t("owner.walkInNoPreference")}
                </Text>
                <Text style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Date · </Text>
                  {date} · {time}
                </Text>
                <Text style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Paiement · </Text>
                  {t("owner.walkInPayAtSalon")}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable style={styles.outlineBtn} onPress={goBack}>
            <Text style={styles.outlineText}>{t("owner.walkInBack")}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.primaryBtn,
              styles.flexBtn,
              (!canGoNext || bookMutation.isPending) && styles.disabled,
            ]}
            disabled={!canGoNext || bookMutation.isPending}
            onPress={goNext}>
            <Text style={styles.primaryBtnText}>{footerLabel}</Text>
          </Pressable>
        </View>
      </View>
    </OwnerStackShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 12 },
  section: { gap: 10 },
  stepTitle: { fontSize: 16, fontWeight: "600", color: ownerColors.text, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", color: ownerColors.textDim },
  spaced: { marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: ownerColors.card,
    color: ownerColors.text,
  },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    backgroundColor: ownerColors.card,
  },
  chipActive: { backgroundColor: ownerColors.primaryMuted, borderColor: ownerColors.primary },
  chipText: { color: ownerColors.textMuted },
  chipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  clientRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
  },
  clientRowActive: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  clientName: { fontWeight: "600", color: ownerColors.text },
  clientSub: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  empty: { fontSize: 14, color: ownerColors.textMuted, textAlign: "center", paddingVertical: 16 },
  loader: { marginVertical: 16 },
  calendarCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 12,
  },
  selectedDate: {
    fontSize: 14,
    fontWeight: "600",
    color: ownerColors.primary,
    textAlign: "center",
    marginBottom: 4,
  },
  option: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
  },
  optionActive: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  optionText: { fontSize: 15, color: ownerColors.text },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
  },
  slotActive: { backgroundColor: ownerColors.primary, borderColor: ownerColors.primary },
  slotText: { fontSize: 14, color: ownerColors.text },
  slotTextActive: { color: "#fff", fontWeight: "600" },
  summaryCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    gap: 10,
  },
  summaryLine: { fontSize: 15, color: ownerColors.text, lineHeight: 22 },
  summaryLabel: { fontWeight: "600", color: ownerColors.textDim },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ownerColors.border,
    backgroundColor: ownerColors.bg,
  },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: ownerColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  outlineText: { color: ownerColors.primary, fontWeight: "600" },
  flexBtn: { flex: 2 },
  disabled: { opacity: 0.5 },
});
