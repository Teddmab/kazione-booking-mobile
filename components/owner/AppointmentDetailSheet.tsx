import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors } from "@/constants/ownerTheme";
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

interface Props {
  appointment: AppointmentWithRelations | null;
  visible: boolean;
  onClose: () => void;
  onConfirmStatus: (id: string, status: AppointmentStatus) => void;
  onCancel: (id: string, reason: string) => void;
  onReschedule: (appt: AppointmentWithRelations) => void;
  busy?: boolean;
}

export function AppointmentDetailSheet({
  appointment,
  visible,
  onClose,
  onConfirmStatus,
  onCancel,
  onReschedule,
  busy,
}: Props) {
  const [showReasons, setShowReasons] = useState(false);
  const [customReason, setCustomReason] = useState("");

  if (!appointment) return null;

  const name = clientDisplayName(
    appointment.client.first_name,
    appointment.client.last_name,
  );
  const status = appointment.status as AppointmentStatus;
  const readOnly =
    status === "completed" || status === "cancelled" || status === "no_show";

  const submitCancel = (reason: string) => {
    onCancel(appointment.id, reason.trim());
    setShowReasons(false);
    setCustomReason("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{name}</Text>
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
                      onPress={() => onConfirmStatus(appointment.id, "completed")}>
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
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
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
  content: { paddingHorizontal: 20, paddingBottom: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  title: { flex: 1, fontSize: 20, fontWeight: "700", color: ownerColors.text },
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
  actions: { gap: 10, marginTop: 20 },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
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
  closeBtn: { alignItems: "center", paddingTop: 8 },
  closeText: { fontSize: 15, color: ownerColors.primary, fontWeight: "600" },
});
