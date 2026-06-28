import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OwnerSheetHeader } from "@/components/owner/OwnerSheetHeader";
import { ProductsUsedSheet } from "@/components/owner/appointments/ProductsUsedSheet";
import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors } from "@/constants/ownerTheme";
import { useToast } from "@/contexts/ToastContext";
import { useOwnerStaff } from "@/hooks/useOwnerStaff";
import {
  useAssignAppointmentStaff,
  useSendAppointmentReminder,
} from "@/hooks/useOwnerAppointments";
import {
  clientDisplayName,
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/format";
import type { AppointmentStatus, AppointmentWithRelations } from "@/types/owner";

const CANCEL_REASONS = [
  "Le client a annulé",
  "Erreur de réservation",
  "Indisponibilité du salon",
  "Autre",
];

type ReminderState = "idle" | "sending" | "sent" | "error";

interface Props {
  appointment: AppointmentWithRelations | null;
  businessId: string;
  visible: boolean;
  onClose: () => void;
  onConfirmStatus: (id: string, status: AppointmentStatus) => void;
  onCancel: (id: string, reason: string) => void;
  onReschedule: (appt: AppointmentWithRelations) => void;
  onDelete?: (id: string) => void;
  onAssigned?: () => void;
  busy?: boolean;
}

export function AppointmentDetailSheet({
  appointment,
  businessId,
  visible,
  onClose,
  onConfirmStatus,
  onCancel,
  onReschedule,
  onDelete,
  onAssigned,
  busy,
}: Props) {
  const toast = useToast();
  const [showReasons, setShowReasons] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [productsSheetOpen, setProductsSheetOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);
  const [reminderState, setReminderState] = useState<ReminderState>("idle");
  const [reminderError, setReminderError] = useState("");

  const { data: staffList = [] } = useOwnerStaff(businessId);
  const assignStaff = useAssignAppointmentStaff(businessId);
  const sendReminder = useSendAppointmentReminder(businessId);

  useEffect(() => {
    if (!visible) {
      setShowReasons(false);
      setCustomReason("");
      setSelectedStaffId(null);
      setStaffPickerOpen(false);
      setReminderState("idle");
      setReminderError("");
      setShowDeleteConfirm(false);
      setDeleteInput("");
    }
  }, [visible, appointment?.id]);

  if (!appointment) return null;

  const name = clientDisplayName(
    appointment.client.first_name,
    appointment.client.last_name,
  );
  const status = appointment.status as AppointmentStatus;
  const readOnly =
    status === "completed" || status === "cancelled" || status === "no_show";
  const showAssign =
    !appointment.staff && !readOnly;
  const showReminder =
    status === "confirmed" && !!appointment.client.email;

  const activeStaff = staffList.filter((s) => s.is_active && !s.is_pending_invite);
  const selectedStaffName =
    activeStaff.find((s) => s.id === selectedStaffId)?.display_name ?? null;

  const submitCancel = (reason: string) => {
    onCancel(appointment.id, reason.trim());
    setShowReasons(false);
    setCustomReason("");
  };

  function handleCompletePress() {
    // Show products-used sheet; onConfirm will fire the actual status update
    setProductsSheetOpen(true);
  }

  const onAssign = () => {
    if (!selectedStaffId) return;
    assignStaff.mutate(
      { id: appointment.id, staffProfileId: selectedStaffId },
      {
        onSuccess: () => {
          toast.success("Assigné", "Le rendez-vous a été assigné.");
          onAssigned?.();
          onClose();
        },
        onError: (e) => toast.error("Erreur", e.message),
      },
    );
  };

  const onSendReminder = () => {
    setReminderState("sending");
    setReminderError("");
    sendReminder.mutate(appointment.id, {
      onSuccess: (result) => {
        if ((result.reminders?.sent ?? 0) > 0) {
          setReminderState("sent");
        } else {
          toast.warning("Attention", "L'email n'a pas pu être envoyé.");
          setReminderState("idle");
        }
      },
      onError: (e) => {
        setReminderState("error");
        setReminderError(e.message);
      },
    });
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <OwnerSheetHeader title={name} onClose={onClose} style={styles.sheetHeader} />
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.headerRow}>
                <StatusBadge status={appointment.status} />
              </View>

              {appointment.client.phone ? (
                <Text style={styles.line}>📞 {appointment.client.phone}</Text>
              ) : null}
              {appointment.client.email ? (
                <Text style={styles.line}>✉️ {appointment.client.email}</Text>
              ) : null}

              <Text style={styles.section}>Prestation</Text>
              <Text style={styles.line}>
                {appointment.service.name} · {appointment.service.duration_minutes} min ·{" "}
                {formatCurrency(appointment.price)}
              </Text>

              <Text style={styles.section}>Équipe & horaire</Text>
              <Text style={styles.line}>
                {appointment.staff?.display_name ?? "Sans préférence"}
              </Text>
              <Text style={styles.line}>
                {formatDate(appointment.starts_at)} · {formatTime(appointment.starts_at)} –{" "}
                {formatTime(appointment.ends_at)}
              </Text>

              <Text style={styles.ref}>Réf. {appointment.booking_reference}</Text>

              {showAssign ? (
                <View style={styles.assignBox}>
                  <Text style={styles.assignTitle}>
                    Non assigné — Choisir un membre de l&apos;équipe
                  </Text>
                  <Pressable
                    style={styles.pickerBtn}
                    onPress={() => setStaffPickerOpen(true)}>
                    <Text style={styles.pickerText}>
                      {selectedStaffName ?? "Sélectionner"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.primaryBtn,
                      (!selectedStaffId || assignStaff.isPending) && styles.btnDisabled,
                    ]}
                    disabled={!selectedStaffId || assignStaff.isPending || busy}
                    onPress={onAssign}>
                    {assignStaff.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Assigner</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

              {!readOnly && !showReasons ? (
                <View style={styles.actions}>
                  {status === "pending" ? (
                    <>
                      <Pressable
                        style={styles.primaryBtn}
                        disabled={busy}
                        onPress={() => onConfirmStatus(appointment.id, "confirmed")}>
                        <Text style={styles.primaryBtnText}>Confirmer</Text>
                      </Pressable>
                      <Pressable
                        style={styles.dangerOutline}
                        disabled={busy}
                        onPress={() => setShowReasons(true)}>
                        <Text style={styles.dangerText}>Annuler</Text>
                      </Pressable>
                    </>
                  ) : null}

                  {status === "confirmed" || status === "in_progress" ? (
                    <>
                      <Pressable
                        style={styles.primaryBtn}
                        disabled={busy}
                        onPress={handleCompletePress}>
                        <Text style={styles.primaryBtnText}>Terminer</Text>
                      </Pressable>
                      <Pressable
                        style={styles.outlineBtn}
                        disabled={busy}
                        onPress={() => onConfirmStatus(appointment.id, "no_show")}>
                        <Text style={styles.outlineText}>Absent</Text>
                      </Pressable>
                      <Pressable
                        style={styles.outlineBtn}
                        disabled={busy}
                        onPress={() => {
                          onClose();
                          onReschedule(appointment);
                        }}>
                        <Text style={styles.outlineText}>Reprogrammer</Text>
                      </Pressable>
                      <Pressable
                        style={styles.dangerOutline}
                        disabled={busy}
                        onPress={() => setShowReasons(true)}>
                        <Text style={styles.dangerText}>Annuler</Text>
                      </Pressable>
                    </>
                  ) : null}

                  {showReminder ? (
                    <>
                      <Pressable
                        style={[
                          styles.outlineBtn,
                          (reminderState === "sent" || reminderState === "sending") &&
                            styles.btnDisabled,
                        ]}
                        disabled={
                          reminderState === "sent" ||
                          reminderState === "sending" ||
                          busy
                        }
                        onPress={onSendReminder}>
                        {reminderState === "sending" ? (
                          <ActivityIndicator color={ownerColors.primary} />
                        ) : (
                          <Text style={styles.outlineText}>
                            {reminderState === "sent"
                              ? "Rappel envoyé ✓"
                              : "🔔 Envoyer un rappel"}
                          </Text>
                        )}
                      </Pressable>
                      {reminderState === "sent" ? (
                        <Text style={styles.reminderOk}>Rappel envoyé par email</Text>
                      ) : null}
                      {reminderState === "error" ? (
                        <Text style={styles.reminderErr}>{reminderError}</Text>
                      ) : null}
                    </>
                  ) : null}
                </View>
              ) : null}

              {showReasons ? (
                <View style={styles.reasonBox}>
                  <Text style={styles.section}>Motif d&apos;annulation</Text>
                  {CANCEL_REASONS.map((r) => (
                    <Pressable
                      key={r}
                      style={styles.reasonChip}
                      disabled={busy}
                      onPress={() => {
                        if (r === "Autre") return;
                        submitCancel(r);
                      }}>
                      <Text style={styles.reasonChipText}>{r}</Text>
                    </Pressable>
                  ))}
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="Précisez le motif…"
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                  />
                  <Pressable
                    style={styles.primaryBtn}
                    disabled={busy || !customReason.trim()}
                    onPress={() => submitCancel(customReason)}>
                    <Text style={styles.primaryBtnText}>Confirmer l&apos;annulation</Text>
                  </Pressable>
                  <Pressable onPress={() => setShowReasons(false)}>
                    <Text style={styles.cancelLink}>Retour</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Delete — only for completed appointments */}
              {status === "completed" && !showDeleteConfirm ? (
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => { setShowDeleteConfirm(true); setDeleteInput(""); }}>
                  <Text style={styles.deleteText}>Supprimer ce rendez-vous</Text>
                </Pressable>
              ) : null}

              {showDeleteConfirm ? (
                <View style={styles.deleteBox}>
                  <Text style={styles.deleteBoxTitle}>Supprimer le rendez-vous ?</Text>
                  <Text style={styles.deleteBoxHint}>
                    Cette action est irréversible. Tapez{" "}
                    <Text style={styles.deleteWord}>delete</Text> pour confirmer.
                  </Text>
                  <TextInput
                    style={styles.deleteInput}
                    placeholder="delete"
                    value={deleteInput}
                    onChangeText={setDeleteInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    style={[styles.deleteConfirmBtn, deleteInput !== "delete" && styles.disabled]}
                    disabled={deleteInput !== "delete" || busy}
                    onPress={() => { onDelete?.(appointment.id); setShowDeleteConfirm(false); }}>
                    <Text style={styles.deleteConfirmText}>Supprimer définitivement</Text>
                  </Pressable>
                  <Pressable onPress={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}>
                    <Text style={styles.cancelLink}>Annuler</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>

        <Modal visible={staffPickerOpen} transparent animationType="fade">
          <Pressable style={styles.pickerBackdrop} onPress={() => setStaffPickerOpen(false)}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Choisir un membre</Text>
              <FlatList
                data={activeStaff}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.pickerRow}
                    onPress={() => {
                      setSelectedStaffId(item.id);
                      setStaffPickerOpen(false);
                    }}>
                    <Text style={styles.pickerRowName}>{item.display_name}</Text>
                    <Text style={styles.pickerRowRole}>{item.role}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.pickerEmpty}>Aucun membre actif</Text>
                }
              />
            </View>
          </Pressable>
        </Modal>
      </Modal>

      <ProductsUsedSheet
        visible={productsSheetOpen}
        onClose={() => setProductsSheetOpen(false)}
        businessId={businessId}
        appointmentId={appointment.id}
        onConfirm={() => {
          setProductsSheetOpen(false);
          onConfirmStatus(appointment.id, "completed");
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ownerColors.border,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: { paddingHorizontal: 20, marginBottom: 4 },
  content: { paddingHorizontal: 20, paddingBottom: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  section: {
    fontSize: 12,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 4,
  },
  line: { fontSize: 15, color: ownerColors.text, lineHeight: 22 },
  ref: { fontSize: 13, color: ownerColors.textMuted, marginTop: 12 },
  assignBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
    gap: 10,
  },
  assignTitle: { fontSize: 13, fontWeight: "600", color: "#92400E" },
  pickerBtn: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  pickerText: { fontSize: 15, color: ownerColors.text },
  actions: { gap: 10, marginTop: 20 },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  btnDisabled: { opacity: 0.55 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: ownerColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  outlineText: { color: ownerColors.primary, fontWeight: "600" },
  dangerOutline: {
    borderWidth: 1,
    borderColor: ownerColors.danger,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  dangerText: { color: ownerColors.danger, fontWeight: "600" },
  reminderOk: { fontSize: 13, color: "#10B981", textAlign: "center" },
  reminderErr: { fontSize: 13, color: ownerColors.danger, textAlign: "center" },
  reasonBox: { marginTop: 12, gap: 8 },
  reasonChip: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.bg,
  },
  reasonChipText: { fontSize: 14, color: ownerColors.text },
  reasonInput: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 72,
    fontSize: 15,
    textAlignVertical: "top",
  },
  cancelLink: { textAlign: "center", color: ownerColors.textMuted, paddingVertical: 8 },
  deleteBtn: {
    marginTop: 24,
    paddingVertical: 10,
    alignItems: "center",
  },
  deleteText: { fontSize: 14, color: ownerColors.danger, fontWeight: "500" },
  deleteBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.danger,
    backgroundColor: "#fff5f5",
    gap: 10,
  },
  deleteBoxTitle: { fontSize: 16, fontWeight: "700", color: ownerColors.danger },
  deleteBoxHint: { fontSize: 13, color: ownerColors.textDim, lineHeight: 19 },
  deleteWord: { fontWeight: "700", color: ownerColors.danger },
  deleteInput: {
    borderWidth: 1,
    borderColor: ownerColors.danger,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: ownerColors.text,
  },
  deleteConfirmBtn: {
    backgroundColor: ownerColors.danger,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteConfirmText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  disabled: { opacity: 0.4 },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  pickerSheet: {
    backgroundColor: ownerColors.card,
    borderRadius: 16,
    maxHeight: "60%",
    padding: 16,
  },
  pickerTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12, color: ownerColors.text },
  pickerRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  pickerRowName: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  pickerRowRole: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  pickerEmpty: { textAlign: "center", color: ownerColors.textMuted, padding: 20 },
});
