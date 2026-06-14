import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors } from "@/constants/ownerTheme";
import { useOwnerClientDetail } from "@/hooks/useOwnerClients";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import type {
  AppointmentWithRelations,
  ClientRecentAppointment,
  ClientWithStats,
} from "@/types/owner";

export interface ClientEditValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
}

type DetailTab = "profile" | "bookings";

interface Props {
  client: ClientWithStats | null;
  businessId: string;
  visible: boolean;
  onClose: () => void;
  onSave?: (id: string, values: ClientEditValues) => void;
  onBook?: (clientId: string, clientName: string) => void;
  onAppointmentPress?: (appointment: AppointmentWithRelations) => void;
  busy?: boolean;
}

function mapRecentToAppointment(
  businessId: string,
  client: ClientWithStats,
  appt: ClientRecentAppointment,
): AppointmentWithRelations {
  return {
    id: appt.id,
    business_id: businessId,
    client_id: client.id,
    staff_profile_id: appt.staff?.id ?? null,
    service_id: appt.service.id,
    status: appt.status,
    starts_at: appt.starts_at,
    ends_at: appt.ends_at,
    duration_minutes: appt.service.duration_minutes,
    price: appt.price,
    deposit_amount: 0,
    booking_reference: appt.booking_reference,
    client: {
      id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone,
    },
    service: {
      id: appt.service.id,
      name: appt.service.name,
      duration_minutes: appt.service.duration_minutes,
      price: appt.service.price,
    },
    staff: appt.staff
      ? {
          id: appt.staff.id,
          display_name: appt.staff.display_name,
          avatar_url: appt.staff.avatar_url,
        }
      : null,
    payment: null,
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatInline({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statInline}>
      <Text style={styles.statInlineValue}>{value}</Text>
      <Text style={styles.statInlineLabel}>{label}</Text>
    </View>
  );
}

function BookingSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

export function ClientDetailSheet({
  client,
  businessId,
  visible,
  onClose,
  onSave,
  onBook,
  onAppointmentPress,
  busy,
}: Props) {
  const [tab, setTab] = useState<DetailTab>("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const detailQuery = useOwnerClientDetail(visible && client ? client.id : null);

  useEffect(() => {
    if (!client || !visible) return;
    setTab("profile");
    setFirstName(client.first_name);
    setLastName(client.last_name);
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setNotes((client as { notes?: string }).notes ?? "");
  }, [client, visible]);

  if (!client) return null;

  const name = clientDisplayName(client.first_name, client.last_name);
  const appointments = detailQuery.data?.recent_appointments ?? [];

  const save = () => {
    if (!onSave) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Champs requis", "Prénom et nom sont obligatoires.");
      return;
    }
    onSave(client.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    });
  };

  const tabChips = [
    { key: "profile" as const, label: "Profil" },
    { key: "bookings" as const, label: "Réservations" },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{name}</Text>
            <TabChipSelector value={tab} chips={tabChips} onChange={setTab} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {tab === "profile" ? (
              <>
                <View style={styles.statsRow}>
                  <StatInline label="RDV" value={String(client.appointment_count)} />
                  <View style={styles.statDivider} />
                  <StatInline label="Dépenses" value={formatCurrency(client.total_spent)} />
                  <View style={styles.statDivider} />
                  <StatInline
                    label="Dernière visite"
                    value={client.last_visit ? formatDate(client.last_visit) : "—"}
                  />
                </View>

                {onSave ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coordonnées</Text>
                    <Text style={styles.fieldLabel}>Prénom</Text>
                    <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
                    <Text style={styles.fieldLabel}>Nom</Text>
                    <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Text style={styles.fieldLabel}>Téléphone</Text>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                    <Text style={styles.fieldLabel}>Notes</Text>
                    <TextInput
                      style={[styles.input, styles.notes]}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                    />
                  </View>
                ) : (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coordonnées</Text>
                    <View style={styles.infoCard}>
                      <InfoRow label="Email" value={client.email ?? ""} />
                      <InfoRow label="Téléphone" value={client.phone ?? ""} />
                      {notes.trim() ? <InfoRow label="Notes" value={notes} /> : null}
                    </View>
                  </View>
                )}

                {onBook ? (
                  <Pressable style={styles.bookBtn} onPress={() => onBook(client.id, name)}>
                    <Text style={styles.bookBtnText}>Nouvelle réservation</Text>
                  </Pressable>
                ) : null}

                {onSave ? (
                  <Pressable
                    style={[styles.saveBtn, busy && styles.disabled]}
                    disabled={busy}
                    onPress={save}>
                    <Text style={styles.saveBtnText}>
                      {busy ? "Enregistrement…" : "Enregistrer"}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historique</Text>
                {detailQuery.isLoading ? (
                  <BookingSkeleton />
                ) : appointments.length === 0 ? (
                  <Text style={styles.empty}>Aucune réservation pour ce client.</Text>
                ) : (
                  appointments.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.apptRow}
                      onPress={() => {
                        if (!onAppointmentPress) return;
                        onAppointmentPress(mapRecentToAppointment(businessId, client, item));
                      }}>
                      <View style={styles.apptTop}>
                        <Text style={styles.apptDate}>{formatDate(item.starts_at)}</Text>
                        <StatusBadge status={item.status} />
                      </View>
                      <Text style={styles.apptService}>{item.service.name}</Text>
                      <Text style={styles.apptMeta}>
                        {item.staff?.display_name ?? "Sans préférence"} ·{" "}
                        {formatCurrency(item.price)}
                      </Text>
                      <Text style={styles.apptRef}>{item.booking_reference}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}

            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Fermer</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    height: "88%",
  },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexShrink: 0 },
  title: { fontSize: 22, fontWeight: "700", color: ownerColors.text, marginBottom: 12 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 28 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: ownerColors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  statInline: { flex: 1, alignItems: "center", gap: 2 },
  statInlineValue: { fontSize: 14, fontWeight: "700", color: ownerColors.text },
  statInlineLabel: { fontSize: 10, color: ownerColors.textMuted, textAlign: "center" },
  statDivider: { width: 1, height: 28, backgroundColor: ownerColors.border },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: ownerColors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    gap: 12,
  },
  infoRow: { gap: 2 },
  infoLabel: { fontSize: 11, fontWeight: "600", color: ownerColors.textDim },
  infoValue: { fontSize: 15, color: ownerColors.text },
  fieldLabel: { fontSize: 13, color: ownerColors.textDim, marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
  },
  notes: { minHeight: 88, textAlignVertical: "top" },
  bookBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  bookBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  saveBtn: {
    backgroundColor: ownerColors.primaryMuted,
    borderWidth: 1,
    borderColor: ownerColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: ownerColors.primary, fontWeight: "600" },
  apptRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.bg,
  },
  apptTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  apptDate: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  apptService: { fontSize: 15, color: ownerColors.text, marginTop: 6, fontWeight: "600" },
  apptMeta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  apptRef: { fontSize: 11, color: ownerColors.textDim, marginTop: 4 },
  empty: { textAlign: "center", color: ownerColors.textMuted, paddingVertical: 24 },
  skeletonWrap: { gap: 10, paddingVertical: 8 },
  skeletonRow: {
    height: 72,
    borderRadius: 12,
    backgroundColor: ownerColors.border,
    opacity: 0.35,
  },
  close: { alignItems: "center", marginTop: 20, paddingVertical: 10 },
  closeText: { fontSize: 15, color: ownerColors.primary, fontWeight: "600" },
});
