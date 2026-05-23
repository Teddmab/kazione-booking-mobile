import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";

import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { availabilityToDisplaySlots } from "@/lib/bookingSlots";
import { clientDisplayName, formatCurrency, toIsoDate } from "@/lib/format";
import { createBooking, getAvailability } from "@/services/booking";
import { getClients } from "@/services/owner/clients";
import { getOwnerServices } from "@/services/owner/services";
import { getStaffList } from "@/services/owner/staff";
import type { ClientWithStats } from "@/types/owner";

const STEPS = ["Client", "Prestation", "Confirmer"] as const;

export default function WalkInScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const [step, setStep] = useState(0);
  const [isGuest, setIsGuest] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceSearch = useDebouncedCallback((v: string) => setDebouncedSearch(v), 400);

  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [guestName, setGuestName] = useState("Client passage");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("walkin@salon.local");

  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [time, setTime] = useState<string | null>(null);

  const { data: clientsData } = useQuery({
    queryKey: ["owner-clients-search", businessId, debouncedSearch],
    queryFn: () => getClients(businessId, { search: debouncedSearch, limit: 8 }),
    enabled: !!businessId && !isGuest && debouncedSearch.length >= 2,
  });

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
    enabled: !!businessId && !!serviceId && step >= 1,
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
      Alert.alert("Réservé", "Le passage a été enregistré.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (e: Error) => Alert.alert("Erreur", e.message),
  });

  const clientLabel = isGuest
    ? guestName.trim()
    : selectedClient
      ? clientDisplayName(selectedClient.first_name, selectedClient.last_name)
      : "—";

  const submit = () => {
    if (!serviceId || !time || !selectedService) return;
    const name = isGuest
      ? guestName.trim()
      : clientDisplayName(selectedClient!.first_name, selectedClient!.last_name);
    const email = isGuest
      ? guestEmail.trim() || "walkin@salon.local"
      : selectedClient?.email?.trim() || "walkin@salon.local";
    const phone = isGuest ? guestPhone.trim() : selectedClient?.phone?.trim() ?? "";

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

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.steps}>
        {STEPS.map((label, i) => (
          <Text
            key={label}
            style={[styles.stepLabel, i === step && styles.stepLabelActive]}>
            {i + 1}. {label}
          </Text>
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.section}>
          <View style={styles.row}>
            <Pressable
              style={[styles.chip, isGuest && styles.chipActive]}
              onPress={() => setIsGuest(true)}>
              <Text style={[styles.chipText, isGuest && styles.chipTextActive]}>Passage</Text>
            </Pressable>
            <Pressable
              style={[styles.chip, !isGuest && styles.chipActive]}
              onPress={() => setIsGuest(false)}>
              <Text style={[styles.chipText, !isGuest && styles.chipTextActive]}>
                Client existant
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
                placeholder="Rechercher nom ou téléphone…"
                value={search}
                onChangeText={(t) => {
                  setSearch(t);
                  debounceSearch(t);
                }}
              />
              {(clientsData?.clients ?? []).map((c) => (
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
                </Pressable>
              ))}
            </>
          )}

          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              if (!isGuest && !selectedClient) {
                Alert.alert("Client requis", "Sélectionnez un client ou mode passage.");
                return;
              }
              setStep(1);
            }}>
            <Text style={styles.primaryBtnText}>Suivant</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={styles.label}>Service</Text>
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

          <Text style={styles.label}>Coiffeur·se</Text>
          <Pressable
            style={[styles.option, staffId === null && styles.optionActive]}
            onPress={() => {
              setStaffId(null);
              setTime(null);
            }}>
            <Text style={styles.optionText}>Sans préférence</Text>
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

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={(t) => {
              setDate(t);
              setTime(null);
            }}
            placeholder="YYYY-MM-DD"
          />

          {serviceId ? (
            slotsLoading ? (
              <ActivityIndicator color={ownerColors.primary} style={{ marginTop: 12 }} />
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
            )
          ) : null}

          <View style={styles.rowBtns}>
            <Pressable style={styles.outlineBtn} onPress={() => setStep(0)}>
              <Text style={styles.outlineText}>Retour</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, styles.flexBtn, (!serviceId || !time) && styles.disabled]}
              disabled={!serviceId || !time}
              onPress={() => setStep(2)}>
              <Text style={styles.primaryBtnText}>Suivant</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.section}>
          <Text style={styles.summaryLine}>Client : {clientLabel}</Text>
          <Text style={styles.summaryLine}>
            {selectedService?.name} · {time} · {date}
          </Text>
          <Text style={styles.summaryLine}>
            {staffList.find((s) => s.id === staffId)?.display_name ?? "Sans préférence"}
          </Text>
          <Text style={styles.summaryLine}>Paiement au salon</Text>

          <View style={styles.rowBtns}>
            <Pressable style={styles.outlineBtn} onPress={() => setStep(1)}>
              <Text style={styles.outlineText}>Retour</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, styles.flexBtn, bookMutation.isPending && styles.disabled]}
              disabled={bookMutation.isPending}
              onPress={submit}>
              <Text style={styles.primaryBtnText}>
                {bookMutation.isPending ? "Réservation…" : "Réserver"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  content: { padding: 20, paddingBottom: 40 },
  steps: { flexDirection: "row", gap: 12, marginBottom: 20 },
  stepLabel: { fontSize: 12, color: ownerColors.textMuted },
  stepLabelActive: { color: ownerColors.primary, fontWeight: "700" },
  section: { gap: 10 },
  label: { fontSize: 13, fontWeight: "600", color: ownerColors.textDim, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: ownerColors.card,
  },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
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
  clientSub: { fontSize: 13, color: ownerColors.textMuted },
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
  },
  slotActive: { backgroundColor: ownerColors.primary, borderColor: ownerColors.primary },
  slotText: { fontSize: 14, color: ownerColors.text },
  slotTextActive: { color: "#fff", fontWeight: "600" },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
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
  rowBtns: { flexDirection: "row", gap: 10, marginTop: 16 },
  flexBtn: { flex: 2 },
  disabled: { opacity: 0.5 },
  summaryLine: { fontSize: 16, color: ownerColors.text, lineHeight: 26 },
});
