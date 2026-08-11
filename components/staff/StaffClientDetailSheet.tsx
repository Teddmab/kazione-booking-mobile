import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useStaffClientDetail,
  useUpdateStaffClientNotes,
} from "@/hooks/useStaffClients";
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

function statusColors(
  colors: ThemeColors,
): Record<StaffClientStatus, { bg: string; text: string; border: string }> {
  return {
    Frequent: {
      bg: colors.primarySurface,
      text: colors.primary,
      border: colors.primary + "44",
    },
    Returning: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
    New: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  };
}

const STATUS_LABEL_KEYS: Record<StaffClientStatus, string> = {
  Frequent: "staffClientsPage.statusFrequent",
  Returning: "staffClientsPage.statusReturning",
  New: "staffClientsPage.statusNew",
};

export function StaffClientDetailSheet({
  client,
  visible,
  currency,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const detailQ = useStaffClientDetail(visible && client ? client.id : null);
  const updateNotes = useUpdateStaffClientNotes();
  const [tab, setTab] = useState<"info" | "notes">("info");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!visible) {
      setTab("info");
      setNoteText("");
    }
  }, [visible, client?.id]);

  useEffect(() => {
    if (detailQ.data) {
      setNoteText(detailQ.data.notes ?? "");
    }
  }, [detailQ.data?.id, detailQ.data?.notes]);

  if (!client) return null;

  const detail = detailQ.data;
  const status = getStaffClientStatus(client.appointment_count);
  const badge = statusColors(colors)[status];
  const name = `${client.first_name} ${client.last_name}`.trim();
  const initials = `${client.first_name[0] ?? ""}${client.last_name[0] ?? ""}`
    .toUpperCase()
    .slice(0, 2);
  const tags = detail?.tags ?? [];
  const email = detail?.email ?? client.email;
  const phone = detail?.phone ?? client.phone;
  const savedNotes = detail?.notes ?? "";
  const notesDirty = noteText !== savedNotes;

  function handleSaveNotes() {
    updateNotes.mutate(
      { clientId: client!.id, notes: noteText },
      {
        onSuccess: () =>
          toast.success(t("staffClientsPage.tabNotes"), t("staffClientsPage.notesSaved")),
        onError: (err: Error) =>
          toast.error(
            t("common.error"),
            err.message || t("staffClientsPage.notesSaveFailed"),
          ),
      },
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {name || t("staffClientsPage.clientFallback")}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: badge.bg, borderColor: badge.border },
                ]}>
                <Text style={[styles.badgeText, { color: badge.text }]}>
                  {t(STATUS_LABEL_KEYS[status])}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{client.appointment_count}</Text>
              <Text style={styles.metricLabel}>{t("staffClientsPage.visitsLabel")}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {formatRelativeVisit(client.last_visit)}
              </Text>
              <Text style={styles.metricLabel}>{t("staffClientsPage.lastVisit")}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {formatCurrency(client.total_spent, currency)}
              </Text>
              <Text style={styles.metricLabel}>{t("staffClientsPage.spentLabel")}</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, tab === "info" && styles.tabActive]}
              onPress={() => setTab("info")}>
              <Text style={[styles.tabText, tab === "info" && styles.tabTextActive]}>
                {t("staffClientsPage.tabInfo")}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === "notes" && styles.tabActive]}
              onPress={() => setTab("notes")}>
              <Text style={[styles.tabText, tab === "notes" && styles.tabTextActive]}>
                {t("staffClientsPage.tabNotes")}
              </Text>
            </Pressable>
          </View>

          {detailQ.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
          ) : tab === "info" ? (
            <View style={styles.block}>
              {email ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{t("staffAccount.labelEmail")}</Text>
                  <Text style={styles.rowValue}>{email}</Text>
                </View>
              ) : null}
              {phone ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{t("booking.phone")}</Text>
                  <Text style={styles.rowValue}>{phone}</Text>
                </View>
              ) : null}
              {tags.length > 0 ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{t("staffClientsPage.tags")}</Text>
                  <Text style={styles.rowValue}>{tags.join(", ")}</Text>
                </View>
              ) : null}
              {!email && !phone && tags.length === 0 ? (
                <Text style={styles.empty}>{t("staffClientsPage.noExtraInfo")}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.block}>
              <TextInput
                style={styles.notesInput}
                value={noteText}
                onChangeText={setNoteText}
                placeholder={t("staffClientsPage.notesPlaceholder")}
                placeholderTextColor={colors.textDim}
                multiline
                textAlignVertical="top"
                editable={!updateNotes.isPending}
              />
              <Pressable
                style={[
                  styles.saveBtn,
                  (!notesDirty || updateNotes.isPending) && styles.disabled,
                ]}
                disabled={!notesDirty || updateNotes.isPending}
                onPress={handleSaveNotes}>
                {updateNotes.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveText}>{t("common.save")}</Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>{t("common.close")}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 14,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
    name: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
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
      backgroundColor: colors.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      alignItems: "center",
    },
    metricValue: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    metricLabel: {
      fontSize: 11,
      color: colors.textMuted,
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
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    tabActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    tabText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    block: { marginBottom: 12 },
    row: {
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowLabel: {
      fontSize: 11,
      color: colors.textDim,
      marginBottom: 2,
      fontFamily: ownerFonts.medium,
    },
    rowValue: {
      fontSize: 14,
      color: colors.text,
      fontFamily: ownerFonts.regular,
    },
    empty: {
      fontSize: 13,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
    },
    notesInput: {
      minHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
      backgroundColor: colors.bg,
      fontFamily: ownerFonts.regular,
    },
    saveBtn: {
      marginTop: 10,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    saveText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    disabled: { opacity: 0.6 },
    closeBtn: { alignItems: "center", paddingVertical: 14 },
    closeText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textMuted,
      fontFamily: ownerFonts.semiBold,
    },
  });
}
