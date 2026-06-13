import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import type { OwnerServiceRow, StaffMember } from "@/types/owner";

interface Props {
  member: StaffMember | null;
  visible: boolean;
  services: OwnerServiceRow[];
  assignedIds: string[];
  loading?: boolean;
  onClose: () => void;
  onSave: (serviceIds: string[]) => void;
  busy?: boolean;
}

export function StaffServicesSheet({
  member,
  visible,
  services,
  assignedIds,
  loading,
  onClose,
  onSave,
  busy,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setSelected(assignedIds);
  }, [visible, assignedIds]);

  if (!member) return null;

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const activeServices = services.filter((s) => s.is_active);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Services — {member.display_name}</Text>
          {loading ? (
            <ActivityIndicator color={ownerColors.primary} style={styles.loader} />
          ) : (
            <ScrollView>
              {activeServices.map((svc) => {
                const on = selected.includes(svc.id);
                return (
                  <Pressable
                    key={svc.id}
                    style={[styles.row, on && styles.rowOn]}
                    onPress={() => toggle(svc.id)}>
                    <Text style={[styles.rowText, on && styles.rowTextOn]}>{svc.name}</Text>
                    <Text style={styles.check}>{on ? "✓" : ""}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
          <Pressable
            style={[styles.btn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => onSave(selected)}>
            <Text style={styles.btnText}>{busy ? "Enregistrement…" : "Enregistrer"}</Text>
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
    maxHeight: "80%",
  },
  title: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 12 },
  loader: { marginVertical: 24 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    marginBottom: 8,
  },
  rowOn: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  rowText: { fontSize: 15, color: ownerColors.text },
  rowTextOn: { fontWeight: "600", color: ownerColors.primary },
  check: { fontSize: 16, color: ownerColors.primary, fontWeight: "700" },
  btn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600" },
});
