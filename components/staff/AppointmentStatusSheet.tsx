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
import { clientDisplayName, formatTime } from "@/lib/format";
import {
  updateAppointmentStatus,
  type AppointmentStatus,
  type StaffAppointment,
} from "@/services/staff/appointments";

const TRANSITIONS: Record<
  AppointmentStatus,
  { label: string; status: AppointmentStatus }[]
> = {
  pending: [
    { label: "Confirmer", status: "confirmed" },
    { label: "Annuler", status: "cancelled" },
  ],
  confirmed: [
    { label: "Démarrer", status: "in_progress" },
    { label: "Annuler", status: "cancelled" },
  ],
  in_progress: [
    { label: "Terminer", status: "completed" },
    { label: "Absent", status: "no_show" },
  ],
  completed: [],
  no_show: [],
  cancelled: [],
};

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) setError(null);
  }, [visible, appointment?.id]);

  const mutation = useMutation({
    mutationFn: (status: AppointmentStatus) => {
      if (!appointment) throw new Error("No appointment selected");
      return updateAppointmentStatus(appointment.id, status);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["staff-appointments", businessId],
      });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || "Échec de la mise à jour");
    },
  });

  if (!appointment) return null;

  const name = clientDisplayName(
    appointment.client.first_name,
    appointment.client.last_name,
  );
  const actions = TRANSITIONS[appointment.status] ?? [];

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
        </View>

        {actions.length === 0 ? (
          <Text style={styles.readonly}>Aucune action disponible pour ce statut.</Text>
        ) : (
          <View style={styles.actions}>
            {actions.map((action) => {
              const destructive =
                action.status === "cancelled" || action.status === "no_show";
              return (
                <Pressable
                  key={action.status}
                  style={[
                    styles.actionBtn,
                    destructive ? styles.actionDanger : styles.actionPrimary,
                    mutation.isPending && styles.actionDisabled,
                  ]}
                  disabled={mutation.isPending}
                  onPress={() => {
                    setError(null);
                    mutation.mutate(action.status);
                  }}>
                  {mutation.isPending && mutation.variables === action.status ? (
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

        <Pressable style={styles.closeBtn} onPress={onClose} disabled={mutation.isPending}>
          <Text style={styles.closeText}>Fermer</Text>
        </Pressable>
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
  badgeRow: { marginTop: 12, marginBottom: 8 },
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
