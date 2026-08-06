import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { useStaffClientDetail } from "@/hooks/useStaffClients";
import { formatCurrency } from "@/lib/format";
import {
  formatRelativeVisit,
  getStaffClientStatus,
  type StaffClientStatus,
} from "@/lib/staffClientStatus";
import type { ClientWithStats } from "@/types/owner";

interface Props {
  client: ClientWithStats | null;
  visible: boolean;
  currency: string;
  onClose: () => void;
}

const STATUS_COLORS: Record<
  StaffClientStatus,
  { bg: string; text: string; border: string }
> = {
  Frequent: {
    bg: ownerColors.primarySurface,
    text: ownerColors.primary,
    border: ownerColors.primary + "44",
  },
  Returning: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  New: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
};

const STATUS_LABELS: Record<StaffClientStatus, string> = {
  Frequent: "Fréquent",
  Returning: "Récurrent",
  New: "Nouveau",
};

export function StaffClientDetailSheet({
  client,
  visible,
  currency,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const detailQ = useStaffClientDetail(visible && client ? client.id : null);
  const [tab, setTab] = useState<"info" | "notes">("info");

  useEffect(() => {
    if (!visible) setTab("info");
  }, [visible, client?.id]);

  if (!client) return null;

  const detail = detailQ.data;
  const status = getStaffClientStatus(client.appointment_count);
  const colors = STATUS_COLORS[status];
  const name = `${client.first_name} ${client.last_name}`.trim();
  const initials = `${client.first_name[0] ?? ""}${client.last_name[0] ?? ""}`
    .toUpperCase()
    .slice(0, 2);
  const notes = detail?.notes ?? null;
  const tags = detail?.tags ?? [];
  const email = detail?.email ?? client.email;
  const phone = detail?.phone ?? client.phone;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{name || "Client"}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  {STATUS_LABELS[status]}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{client.appointment_count}</Text>
              <Text style={styles.metricLabel}>Visites</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {formatRelativeVisit(client.last_visit)}
              </Text>
              <Text style={styles.metricLabel}>Dernière</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {formatCurrency(client.total_spent, currency)}
              </Text>
              <Text style={styles.metricLabel}>Dépensé</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, tab === "info" && styles.tabActive]}
              onPress={() => setTab("info")}>
              <Text style={[styles.tabText, tab === "info" && styles.tabTextActive]}>
                Infos
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === "notes" && styles.tabActive]}
              onPress={() => setTab("notes")}>
              <Text style={[styles.tabText, tab === "notes" && styles.tabTextActive]}>
                Notes
              </Text>
            </Pressable>
          </View>

          {detailQ.isLoading ? (
            <ActivityIndicator color={ownerColors.primary} style={{ marginTop: 16 }} />
          ) : tab === "info" ? (
            <View style={styles.block}>
              {email ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Email</Text>
                  <Text style={styles.rowValue}>{email}</Text>
                </View>
              ) : null}
              {phone ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Téléphone</Text>
                  <Text style={styles.rowValue}>{phone}</Text>
                </View>
              ) : null}
              {tags.length > 0 ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Tags</Text>
                  <Text style={styles.rowValue}>{tags.join(", ")}</Text>
                </View>
              ) : null}
              {!email && !phone && tags.length === 0 ? (
                <Text style={styles.empty}>Aucune info supplémentaire.</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.block}>
              <Text style={styles.notesHint}>
                Lecture seule — les notes sont modifiables par le propriétaire.
              </Text>
              <Text style={styles.notes}>
                {notes?.trim() ? notes : "Aucune note pour ce client."}
              </Text>
            </View>
          )}
        </ScrollView>

        <Pressable style={styles.closeBtn} onPress={onClose}>
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
    maxHeight: "88%",
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
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ownerColors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: ownerColors.primary,
    fontFamily: ownerFonts.bold,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "600", fontFamily: ownerFonts.semiBold },
  metrics: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  metric: {
    flex: 1,
    backgroundColor: ownerColors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  metricLabel: {
    fontSize: 11,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.medium,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ownerColors.bg,
  },
  tabActive: {
    borderColor: ownerColors.primary,
    backgroundColor: ownerColors.primarySurface,
  },
  tabText: {
    fontSize: 13,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  tabTextActive: {
    color: ownerColors.primary,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  block: { marginBottom: 12 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  rowLabel: {
    fontSize: 11,
    color: ownerColors.textDim,
    marginBottom: 2,
    fontFamily: ownerFonts.medium,
  },
  rowValue: {
    fontSize: 14,
    color: ownerColors.text,
    fontFamily: ownerFonts.regular,
  },
  empty: {
    fontSize: 13,
    color: ownerColors.textDim,
    fontFamily: ownerFonts.regular,
  },
  notesHint: {
    fontSize: 11,
    color: ownerColors.textDim,
    marginBottom: 8,
    fontFamily: ownerFonts.regular,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    color: ownerColors.text,
    fontFamily: ownerFonts.regular,
  },
  closeBtn: { alignItems: "center", paddingVertical: 14 },
  closeText: {
    fontSize: 15,
    fontWeight: "600",
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.semiBold,
  },
});
