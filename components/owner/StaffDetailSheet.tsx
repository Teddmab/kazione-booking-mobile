import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { StatusBadge } from "@/components/owner/StatusBadge";
import { OwnerSheetHeader } from "@/components/owner/OwnerSheetHeader";
import { ownerColors } from "@/constants/ownerTheme";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { getAppointments } from "@/services/owner/appointments";
import type { DateRange } from "@/types/finance";
import type { AppointmentStatus, StaffMember } from "@/types/owner";

type EditableRole = "manager" | "staff" | "receptionist";

const ROLES: { value: EditableRole; label: string }[] = [
  { value: "manager", label: "Gérant" },
  { value: "staff", label: "Coiffeur·se" },
  { value: "receptionist", label: "Réception" },
];

export interface StaffUpdateValues {
  display_name: string;
  position: string;
  role: EditableRole;
  is_active: boolean;
}

export interface StaffPerformanceStats {
  revenue: number;
  bookings: number;
  avg_rating: number;
  completion_rate: number;
}

interface Props {
  member: StaffMember | null;
  businessId: string;
  dateRange: DateRange;
  performanceStats?: StaffPerformanceStats;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, values: StaffUpdateValues) => void;
  onEditSchedule?: () => void;
  onEditServices?: () => void;
  onNewBooking?: (staffId: string, staffName: string) => void;
  onResendInvite?: () => void;
  busy?: boolean;
  resendBusy?: boolean;
}

export function StaffDetailSheet({
  member,
  businessId,
  dateRange,
  performanceStats,
  visible,
  onClose,
  onSave,
  onEditSchedule,
  onEditServices,
  onNewBooking,
  onResendInvite,
  busy,
  resendBusy,
}: Props) {
  const toast = useToast();
  const [displayName, setDisplayName] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState<EditableRole>("staff");
  const [isActive, setIsActive] = useState(true);

  const { data: apptData, isLoading: apptsLoading } = useQuery({
    queryKey: [
      "owner-appointments",
      businessId,
      "staff-detail",
      member?.id,
      dateRange.from,
      dateRange.to,
    ],
    queryFn: () =>
      getAppointments(businessId, {
        staffId: member!.id,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        limit: 5,
        page: 1,
      }),
    enabled: visible && !!member && !!businessId,
  });

  const recentAppointments = apptData?.appointments ?? [];

  useEffect(() => {
    if (!member || !visible) return;
    setDisplayName(member.display_name);
    setPosition(member.position ?? "");
    const r = member.role as EditableRole;
    setRole(r === "manager" || r === "receptionist" ? r : "staff");
    setIsActive(member.is_active);
  }, [member, visible]);

  if (!member) return null;

  const save = () => {
    if (!displayName.trim()) {
      toast.warning("Nom requis", "Le nom affiché ne peut pas être vide.");
      return;
    }
    onSave(member.id, {
      display_name: displayName.trim(),
      position: position.trim(),
      role,
      is_active: isActive,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <OwnerSheetHeader title="Membre de l&apos;équipe" onClose={onClose} disabled={busy} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {member.email ? <Text style={styles.email}>{member.email}</Text> : null}

            {performanceStats ? (
              <View style={styles.kpiGrid}>
                <DashboardStatCard
                  label="Revenus"
                  value={formatCurrency(performanceStats.revenue)}
                  icon="cash-outline"
                />
                <DashboardStatCard
                  label="Réservations"
                  value={String(performanceStats.bookings)}
                  icon="calendar-outline"
                />
                <DashboardStatCard
                  label="Note"
                  value={`${performanceStats.avg_rating.toFixed(1)} / 5`}
                  icon="star-outline"
                />
                <DashboardStatCard
                  label="Complétion"
                  value={`${Math.round(performanceStats.completion_rate)}%`}
                  icon="checkmark-circle-outline"
                />
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Dernières réservations</Text>
            {apptsLoading ? (
              <ActivityIndicator color={ownerColors.primary} style={styles.loader} />
            ) : recentAppointments.length === 0 ? (
              <Text style={styles.empty}>Aucune réservation sur cette période.</Text>
            ) : (
              recentAppointments.map((appt) => (
                <View key={appt.id} style={styles.apptRow}>
                  <View style={styles.apptMain}>
                    <Text style={styles.apptService} numberOfLines={1}>
                      {appt.service.name}
                    </Text>
                    <Text style={styles.apptMeta}>{formatDate(appt.starts_at)}</Text>
                  </View>
                  <View style={styles.apptRight}>
                    <StatusBadge status={appt.status as AppointmentStatus} />
                    <Text style={styles.apptPrice}>{formatCurrency(appt.price)}</Text>
                  </View>
                </View>
              ))
            )}

            <Text style={styles.sectionTitle}>Modifier le profil</Text>

            <Text style={styles.label}>Nom affiché</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

            <Text style={styles.label}>Position</Text>
            <TextInput
              style={styles.input}
              value={position}
              onChangeText={setPosition}
              placeholder="ex. Senior Stylist, Barber"
            />

            <Text style={styles.label}>Rôle</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  style={[styles.chip, role === r.value && styles.chipActive]}
                  onPress={() => setRole(r.value)}>
                  <Text style={[styles.chipText, role === r.value && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Compte actif</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ true: ownerColors.primary }}
              />
            </View>

            {onEditSchedule ? (
              <Pressable style={styles.actionBtn} onPress={onEditSchedule}>
                <Text style={styles.actionText}>Modifier les horaires</Text>
              </Pressable>
            ) : null}
            {onEditServices ? (
              <Pressable style={styles.actionBtn} onPress={onEditServices}>
                <Text style={styles.actionText}>Assigner les services</Text>
              </Pressable>
            ) : null}
            {onResendInvite ? (
              <Pressable
                style={[styles.actionBtn, styles.actionOutline]}
                disabled={resendBusy}
                onPress={onResendInvite}>
                <Text style={styles.actionOutlineText}>
                  {resendBusy ? "Envoi…" : "Renvoyer l'invitation"}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>

          {onNewBooking ? (
            <Pressable
              style={styles.bookingBtn}
              onPress={() => onNewBooking(member.id, member.display_name)}>
              <Text style={styles.bookingBtnText}>
                Nouvelle réservation pour {member.display_name}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={save}>
            <Text style={styles.primaryBtnText}>{busy ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
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
    padding: 20,
    maxHeight: "90%",
  },
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  email: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4, marginBottom: 12 },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ownerColors.text,
    marginTop: 16,
    marginBottom: 10,
  },
  loader: { marginVertical: 12 },
  empty: { fontSize: 14, color: ownerColors.textMuted, marginBottom: 8 },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ownerColors.border,
    gap: 8,
  },
  apptMain: { flex: 1, minWidth: 0 },
  apptService: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  apptMeta: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  apptRight: { alignItems: "flex-end", gap: 4 },
  apptPrice: { fontSize: 13, fontWeight: "600", color: ownerColors.text },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: ownerColors.bg,
  },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  chipActive: { backgroundColor: ownerColors.primaryMuted, borderColor: ownerColors.primary },
  chipText: { fontSize: 13, color: ownerColors.textMuted },
  chipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  switchLabel: { fontSize: 15, color: ownerColors.text },
  actionBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: ownerColors.primaryMuted,
    alignItems: "center",
  },
  actionText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
  actionOutline: {
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  actionOutlineText: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  bookingBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  bookingBtnText: { color: "#fff", fontWeight: "600", fontSize: 14, textAlign: "center" },
  primaryBtn: {
    backgroundColor: ownerColors.primarySurface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: ownerColors.primary,
  },
  disabled: { opacity: 0.6 },
  primaryBtnText: { color: ownerColors.primary, fontWeight: "600" },
});
