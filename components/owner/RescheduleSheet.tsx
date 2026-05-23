import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { ownerColors } from "@/constants/ownerTheme";
import { availabilityToDisplaySlots } from "@/lib/bookingSlots";
import { toIsoDate } from "@/lib/format";
import { getAvailability } from "@/services/booking";
import type { AppointmentWithRelations } from "@/types/owner";

interface Props {
  appointment: AppointmentWithRelations | null;
  businessId: string;
  visible: boolean;
  onClose: () => void;
  onConfirm: (params: {
    appointment_id: string;
    new_date: string;
    new_time: string;
    staff_profile_id: string | null;
  }) => void;
  busy?: boolean;
}

function nextDays(count: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + i);
    out.push(copy);
  }
  return out;
}

export function RescheduleSheet({
  appointment,
  businessId,
  visible,
  onClose,
  onConfirm,
  busy,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const date = selectedDate ?? (appointment ? toIsoDate(new Date()) : null);
  const staffId = appointment?.staff_profile_id ?? null;

  const { data: availability, isLoading } = useQuery({
    queryKey: [
      "owner-reschedule-availability",
      businessId,
      appointment?.service_id,
      date,
      staffId,
    ],
    queryFn: () =>
      getAvailability({
        business_id: businessId,
        service_id: appointment!.service_id,
        date: date!,
        staff_id: staffId ?? undefined,
        payment_method: "later",
      }),
    enabled: !!(visible && appointment && businessId && date),
  });

  const slots = useMemo(
    () =>
      availabilityToDisplaySlots(availability, staffId).filter((s) => s.available),
    [availability, staffId],
  );

  const dayOptions = useMemo(() => nextDays(21), []);

  const handleConfirm = () => {
    if (!appointment || !date || !selectedTime) {
      Alert.alert("Créneau requis", "Choisissez une date et une heure.");
      return;
    }
    onConfirm({
      appointment_id: appointment.id,
      new_date: date,
      new_time: selectedTime,
      staff_profile_id: staffId,
    });
  };

  if (!appointment) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Reprogrammer</Text>
          <Text style={styles.sub}>{appointment.booking_reference}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayStrip}>
            {dayOptions.map((d) => {
              const iso = toIsoDate(d);
              const active = iso === date;
              return (
                <Pressable
                  key={iso}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => {
                    setSelectedDate(iso);
                    setSelectedTime(null);
                  }}>
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                    {d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {isLoading ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color={ownerColors.primary} />
          ) : slots.length === 0 ? (
            <Text style={styles.empty}>Aucun créneau disponible ce jour.</Text>
          ) : (
            <View style={styles.slotGrid}>
              {slots.map((s) => (
                <Pressable
                  key={s.time}
                  style={[styles.slot, selectedTime === s.time && styles.slotActive]}
                  onPress={() => setSelectedTime(s.time)}>
                  <Text
                    style={[
                      styles.slotText,
                      selectedTime === s.time && styles.slotTextActive,
                    ]}>
                    {s.time}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={[styles.primaryBtn, (!selectedTime || busy) && styles.btnDisabled]}
            disabled={!selectedTime || busy}
            onPress={handleConfirm}>
            <Text style={styles.primaryBtnText}>
              {busy ? "En cours…" : "Confirmer le nouveau créneau"}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Annuler</Text>
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
    padding: 20,
    maxHeight: "75%",
  },
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  sub: { fontSize: 13, color: ownerColors.textMuted, marginBottom: 12 },
  dayStrip: { marginBottom: 12, maxHeight: 48 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    marginRight: 8,
    backgroundColor: ownerColors.bg,
  },
  dayChipActive: {
    backgroundColor: ownerColors.primaryMuted,
    borderColor: ownerColors.primary,
  },
  dayChipText: { fontSize: 13, color: ownerColors.textMuted },
  dayChipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  slotActive: {
    backgroundColor: ownerColors.primary,
    borderColor: ownerColors.primary,
  },
  slotText: { fontSize: 14, color: ownerColors.text },
  slotTextActive: { color: "#fff", fontWeight: "600" },
  empty: { color: ownerColors.textMuted, marginVertical: 16, textAlign: "center" },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  cancel: { alignItems: "center", paddingVertical: 12 },
  cancelText: { color: ownerColors.textMuted },
});
