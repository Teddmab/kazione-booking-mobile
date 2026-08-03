import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import { clientDisplayName, formatTime } from "@/lib/format";
import {
  respondToAppointmentOffer,
  updateAppointmentStatus,
  type AppointmentStatus,
  type PaymentMethod,
  type StaffAppointment,
} from "@/services/staff/appointments";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte" },
  { value: "bank_transfer", label: "Virement" },
  { value: "voucher", label: "Bon / voucher" },
  { value: "online", label: "En ligne" },
];

type SheetAction =
  | { kind: "status"; label: string; status: AppointmentStatus; destructive?: boolean }
  | { kind: "offer"; label: string; response: "accept" | "decline"; destructive?: boolean }
  | { kind: "complete"; label: string; destructive?: boolean };

function actionsFor(status: AppointmentStatus): SheetAction[] {
  switch (status) {
    case "offered":
      return [
        { kind: "offer", label: "Accepter", response: "accept" },
        { kind: "offer", label: "Refuser", response: "decline", destructive: true },
      ];
    case "confirmed":
      return [
        { kind: "status", label: "Démarrer", status: "in_progress" },
        { kind: "status", label: "Absent", status: "no_show", destructive: true },
      ];
    case "in_progress":
      return [{ kind: "complete", label: "Terminer" }];
    default:
      return [];
  }
}

interface Props {
  appointment: StaffAppointment | null;
  visible: boolean;
  onClose: () => void;
}

export function AppointmentStatusSheet({ appointment, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const queryClient = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  useEffect(() => {
    if (!visible) {
      setError(null);
      setShowPayment(false);
      setPaymentMethod("cash");
    }
  }, [visible, appointment?.id]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["staff-appointments", businessId],
    });
  };

  const statusMutation = useMutation({
    mutationFn: async (status: AppointmentStatus) => {
      if (!appointment) throw new Error("No appointment selected");
      return updateAppointmentStatus(businessId, appointment.id, status);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Rendez-vous", "Statut mis à jour.");
      onClose();
    },
    onError: (err: Error) => {
      const msg = err.message || "Échec de la mise à jour";
      setError(msg);
      toast.error("Erreur", msg);
    },
  });

  const offerMutation = useMutation({
    mutationFn: async (response: "accept" | "decline") => {
      if (!appointment) throw new Error("No appointment selected");
      return respondToAppointmentOffer(businessId, appointment.id, response);
    },
    onSuccess: async (_data, response) => {
      await invalidate();
      toast.success(
        "Offre",
        response === "accept" ? "Offre acceptée." : "Offre refusée.",
      );
      onClose();
    },
    onError: (err: Error) => {
      const msg = err.message || "Échec de la réponse à l'offre";
      setError(msg);
      toast.error("Erreur", msg);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (method: PaymentMethod) => {
      if (!appointment) throw new Error("No appointment selected");
      return updateAppointmentStatus(
        businessId,
        appointment.id,
        "pending_completion",
        method,
      );
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(
        "Rendez-vous",
        "Terminé — en attente de validation du salon.",
      );
      onClose();
    },
    onError: (err: Error) => {
      const msg = err.message || "Échec de la finalisation";
      setError(msg);
      toast.error("Erreur", msg);
    },
  });

  if (!appointment) return null;

  const name = clientDisplayName(
    appointment.client.first_name,
    appointment.client.last_name,
  );
  const actions = actionsFor(appointment.status);
  const busy =
    statusMutation.isPending || offerMutation.isPending || completeMutation.isPending;
  const readonlyHint =
    appointment.status === "pending"
      ? "En attente de confirmation par le salon."
      : appointment.status === "pending_completion"
        ? "En attente de validation du propriétaire."
        : "Aucune action disponible pour ce statut.";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        <Text style={styles.client}>{name}</Text>
        <Text style={styles.service}>{appointment.service.name}</Text>
        <Text style={styles.time}>
          {formatTime(appointment.starts_at)} – {formatTime(appointment.ends_at)}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={appointment.status} />
          {appointment.referral_staff_id ? (
            <View style={styles.referralBadge}>
              <Text style={styles.referralText}>Via parrainage</Text>
            </View>
          ) : null}
        </View>

        {showPayment ? (
          <View style={styles.paymentBlock}>
            <Text style={styles.paymentTitle}>Moyen de paiement</Text>
            <View style={styles.paymentGrid}>
              {PAYMENT_METHODS.map((method) => {
                const active = paymentMethod === method.value;
                return (
                  <Pressable
                    key={method.value}
                    style={[styles.paymentChip, active && styles.paymentChipActive]}
                    onPress={() => setPaymentMethod(method.value)}
                    disabled={busy}>
                    <Text
                      style={[
                        styles.paymentChipText,
                        active && styles.paymentChipTextActive,
                      ]}>
                      {method.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={[styles.actionBtn, styles.actionPrimary, busy && styles.actionDisabled]}
              disabled={busy}
              onPress={() => {
                setError(null);
                completeMutation.mutate(paymentMethod);
              }}>
              {completeMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionText}>Confirmer la fin</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setShowPayment(false)}
              disabled={busy}>
              <Text style={styles.closeText}>Retour</Text>
            </Pressable>
          </View>
        ) : actions.length === 0 ? (
          <Text style={styles.readonly}>{readonlyHint}</Text>
        ) : (
          <View style={styles.actions}>
            {actions.map((action) => {
              const key =
                action.kind === "offer"
                  ? `offer-${action.response}`
                  : action.kind === "complete"
                    ? "complete"
                    : action.status;
              const destructive = !!action.destructive;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.actionBtn,
                    destructive ? styles.actionDanger : styles.actionPrimary,
                    busy && styles.actionDisabled,
                  ]}
                  disabled={busy}
                  onPress={() => {
                    setError(null);
                    if (action.kind === "offer") {
                      offerMutation.mutate(action.response);
                    } else if (action.kind === "complete") {
                      setShowPayment(true);
                    } else {
                      statusMutation.mutate(action.status);
                    }
                  }}>
                  {busy &&
                  ((action.kind === "offer" &&
                    offerMutation.variables === action.response) ||
                    (action.kind === "status" &&
                      statusMutation.variables === action.status)) ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionText}>{action.label}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!showPayment ? (
          <Pressable style={styles.closeBtn} onPress={onClose} disabled={busy}>
            <Text style={styles.closeText}>Fermer</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,15,10,0.4)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: ownerColors.border,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ownerColors.border,
    marginBottom: 14,
  },
  client: {
    fontSize: 20,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  service: {
    fontSize: 15,
    color: ownerColors.textMuted,
    marginTop: 4,
    fontFamily: ownerFonts.regular,
  },
  time: {
    fontSize: 13,
    color: ownerColors.textDim,
    marginTop: 4,
    fontFamily: ownerFonts.medium,
  },
  badgeRow: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  referralBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  referralText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4338CA",
    fontFamily: ownerFonts.semiBold,
  },
  readonly: {
    fontSize: 14,
    color: ownerColors.textDim,
    marginVertical: 12,
    fontFamily: ownerFonts.regular,
  },
  actions: { gap: 10, marginTop: 8 },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimary: { backgroundColor: ownerColors.primary },
  actionDanger: { backgroundColor: ownerColors.danger },
  actionDisabled: { opacity: 0.7 },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  paymentBlock: { marginTop: 8, gap: 12 },
  paymentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
  },
  paymentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  paymentChip: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: ownerColors.bg,
  },
  paymentChipActive: {
    borderColor: ownerColors.primary,
    backgroundColor: ownerColors.primarySurface,
  },
  paymentChipText: {
    fontSize: 13,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  paymentChipTextActive: {
    color: ownerColors.primary,
    fontWeight: "600",
  },
  error: {
    color: ownerColors.danger,
    fontSize: 13,
    marginTop: 10,
    fontFamily: ownerFonts.regular,
  },
  closeBtn: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  closeText: {
    fontSize: 15,
    fontWeight: "600",
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.semiBold,
  },
});
