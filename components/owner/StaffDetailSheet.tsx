import { Ionicons } from "@expo/vector-icons";
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
import { useStaffDetail, useStaffCommissions, usePayCommissions } from "@/hooks/useOwnerStaff";
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
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<Set<string>>(new Set());
  const [payMethod, setPayMethod] = useState<"cash" | "bank_transfer" | "offset">("cash");

  const { data: staffDetail } = useStaffDetail(visible ? (member?.id ?? null) : null, businessId);
  const { data: commissionsData, refetch: refetchCommissions } = useStaffCommissions(
    visible ? (member?.id ?? null) : null,
    businessId,
    { status: "unpaid" },
  );
  const payCommissionsMutation = usePayCommissions(businessId);

  const unpaidCommissions = commissionsData?.commissions ?? [];

  function toggleCommission(id: string) {
    setSelectedCommissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handlePaySelected() {
    if (selectedCommissionIds.size === 0) return;
    payCommissionsMutation.mutate(
      { appointmentIds: Array.from(selectedCommissionIds), payMethod },
      {
        onSuccess: ({ paid_count }) => {
          toast.success("Commissions paid", `${paid_count} marked as paid`);
          setSelectedCommissionIds(new Set());
          void refetchCommissions();
        },
        onError: (err: Error) => toast.error("Payment failed", err.message),
      },
    );
  }

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

            {/* Bank Account section */}
            <Text style={styles.sectionTitle}>Bank Account</Text>
            {staffDetail?.bank_account_iban ? (
              <View style={styles.bankCard}>
                <View style={styles.bankRow}>
                  <Ionicons name="card-outline" size={15} color={ownerColors.primary} />
                  <Text style={styles.bankIban}>
                    {staffDetail.bank_account_iban.replace(/(.{4})/g, "$1 ").trim()}
                  </Text>
                </View>
                {staffDetail.bank_account_holder_name ? (
                  <Text style={styles.bankMeta}>{staffDetail.bank_account_holder_name}</Text>
                ) : null}
                {staffDetail.bank_account_bank_name ? (
                  <Text style={styles.bankMeta}>{staffDetail.bank_account_bank_name}</Text>
                ) : null}
                {staffDetail.bank_account_is_entrepreneur ? (
                  <View style={styles.entrepreneurBadge}>
                    <Text style={styles.entrepreneurBadgeText}>FIE / OÜ account</Text>
                  </View>
                ) : (
                  <View style={[styles.entrepreneurBadge, styles.entrepreneurBadgeWarn]}>
                    <Text style={[styles.entrepreneurBadgeText, { color: "#92400e" }]}>
                      Not confirmed as business account
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.empty}>Staff has not provided bank details yet.</Text>
            )}

            {/* Commissions section */}
            <Text style={styles.sectionTitle}>Unpaid Commissions</Text>
            {commissionsData && (
              <View style={styles.commissionSummary}>
                <Text style={styles.commissionSummaryText}>
                  Unpaid: {formatCurrency(commissionsData.summary.total_unpaid)}
                  {"  ·  "}
                  Paid: {formatCurrency(commissionsData.summary.total_paid)}
                </Text>
              </View>
            )}
            {unpaidCommissions.length === 0 ? (
              <Text style={styles.empty}>No unpaid commissions.</Text>
            ) : (
              <>
                {unpaidCommissions.map((row) => {
                  const selected = selectedCommissionIds.has(row.appointment_id);
                  return (
                    <Pressable
                      key={row.appointment_id}
                      style={[styles.commissionRow, selected && styles.commissionRowSelected]}
                      onPress={() => toggleCommission(row.appointment_id)}>
                      <View style={[styles.commissionCheck, selected && styles.commissionCheckActive]}>
                        {selected ? <Ionicons name="checkmark" size={11} color="#fff" /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.apptService}>{row.service_name}</Text>
                        <Text style={styles.apptMeta}>
                          {formatDate(row.starts_at)} · {row.client_name}
                        </Text>
                      </View>
                      <Text style={[styles.apptPrice, { color: "#d97706" }]}>
                        {formatCurrency(row.commission_amount)}
                      </Text>
                    </Pressable>
                  );
                })}

                {selectedCommissionIds.size > 0 && (
                  <View style={styles.payPanel}>
                    <View style={styles.payMethodRow}>
                      {(["cash", "bank_transfer", "offset"] as const).map((m) => (
                        <Pressable
                          key={m}
                          style={[styles.methodChip, payMethod === m && styles.methodChipActive]}
                          onPress={() => setPayMethod(m)}>
                          <Text style={[styles.methodChipText, payMethod === m && styles.methodChipTextActive]}>
                            {m === "cash" ? "Cash" : m === "bank_transfer" ? "Bank" : "Offset"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable
                      style={[styles.payBtn, payCommissionsMutation.isPending && styles.disabled]}
                      disabled={payCommissionsMutation.isPending}
                      onPress={handlePaySelected}>
                      {payCommissionsMutation.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.payBtnText}>
                          Pay {selectedCommissionIds.size} selected
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </>
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
  bankCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.bg,
    padding: 14,
    gap: 6,
  },
  bankRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bankIban: { fontSize: 14, fontFamily: "monospace", color: ownerColors.text, fontWeight: "600" },
  bankMeta: { fontSize: 13, color: ownerColors.textMuted },
  entrepreneurBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#dcfce7",
  },
  entrepreneurBadgeWarn: { backgroundColor: "#fef3c7" },
  entrepreneurBadgeText: { fontSize: 11, fontWeight: "600", color: "#166534" },
  commissionSummary: {
    padding: 10,
    backgroundColor: ownerColors.primaryMuted,
    borderRadius: 8,
    marginBottom: 6,
  },
  commissionSummaryText: { fontSize: 13, color: ownerColors.primary, fontWeight: "600" },
  commissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  commissionRowSelected: { backgroundColor: ownerColors.primaryMuted, borderRadius: 8 },
  commissionCheck: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  commissionCheckActive: {
    backgroundColor: ownerColors.primary,
    borderColor: ownerColors.primary,
  },
  payPanel: {
    marginTop: 10,
    gap: 8,
  },
  payMethodRow: { flexDirection: "row", gap: 8 },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.bg,
  },
  methodChipActive: {
    backgroundColor: ownerColors.primaryMuted,
    borderColor: ownerColors.primary,
  },
  methodChipText: { fontSize: 13, color: ownerColors.textMuted },
  methodChipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  payBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: ownerColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
