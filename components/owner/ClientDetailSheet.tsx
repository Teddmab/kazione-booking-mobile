import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import type { ClientWithStats } from "@/types/owner";

interface Props {
  client: ClientWithStats | null;
  visible: boolean;
  onClose: () => void;
}

export function ClientDetailSheet({ client, visible, onClose }: Props) {
  if (!client) return null;

  const name = clientDisplayName(client.first_name, client.last_name);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{name}</Text>

          {client.email ? <Text style={styles.line}>✉️ {client.email}</Text> : null}
          {client.phone ? <Text style={styles.line}>📞 {client.phone}</Text> : null}

          <View style={styles.statsBox}>
            <Text style={styles.stat}>
              Rendez-vous : {client.appointment_count} au total
            </Text>
            <Text style={styles.stat}>
              Dépenses : {formatCurrency(client.total_spent)}
            </Text>
            {client.last_visit ? (
              <Text style={styles.stat}>
                Dernière visite : {formatDate(client.last_visit)}
              </Text>
            ) : (
              <Text style={styles.statMuted}>Pas encore de visite enregistrée</Text>
            )}
          </View>

          <Pressable onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Fermer</Text>
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
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: "700", color: ownerColors.text, marginBottom: 12 },
  line: { fontSize: 15, color: ownerColors.text, lineHeight: 24 },
  statsBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: ownerColors.bg,
    borderWidth: 1,
    borderColor: ownerColors.border,
    gap: 8,
  },
  stat: { fontSize: 15, color: ownerColors.text },
  statMuted: { fontSize: 14, color: ownerColors.textMuted },
  close: { alignItems: "center", marginTop: 20, paddingVertical: 10 },
  closeText: { fontSize: 15, color: ownerColors.primary, fontWeight: "600" },
});
