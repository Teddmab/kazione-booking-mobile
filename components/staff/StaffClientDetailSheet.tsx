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
  useClientEntitlements,
  useStaffClientDetail,
  useUpdateStaffClientNotes,
} from "@/hooks/useStaffClients";
import { formatCurrency } from "@/lib/format";
import {
  formatRelativeVisit,
  getStaffClientStatus,
  type StaffClientStatus,
} from "@/lib/staffClientStatus";
import type {
  ClientEntitlement,
  EntitlementStatus,
  EntitlementType,
} from "@/services/staff/entitlements";
import type { ClientWithStats } from "@/types/owner";

interface Props {
  client: ClientWithStats | null;
  visible: boolean;
  currency: string;
  onClose: () => void;
}

type DetailTab = "info" | "notes" | "entitlements";

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

const TYPE_META: Record<
  EntitlementType,
  { labelKey: string; bg: string; text: string; border: string }
> = {
  appointment_discount: {
    labelKey: "staffClientsPage.entTypeDiscount",
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
  },
  package: {
    labelKey: "staffClientsPage.entTypePackage",
    bg: "#F5F3FF",
    text: "#6D28D9",
    border: "#DDD6FE",
  },
  training: {
    labelKey: "staffClientsPage.entTypeTraining",
    bg: "#EEF2FF",
    text: "#4338CA",
    border: "#C7D2FE",
  },
  gift_voucher: {
    labelKey: "staffClientsPage.entTypeVoucher",
    bg: "#ECFDF5",
    text: "#047857",
    border: "#A7F3D0",
  },
};

const ENT_STATUS_STYLE: Record<
  EntitlementStatus,
  { bg: string; text: string; border: string }
> = {
  active: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  used: { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" },
  expired: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  cancelled: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
};

function entitlementSummary(
  ent: ClientEntitlement,
  currency: string,
  language: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (ent.type === "appointment_discount") {
    if (ent.discount_type === "percentage") {
      return t("staffClientsPage.entDiscountPct", { value: ent.discount_value ?? 0 });
    }
    return t("staffClientsPage.entDiscountFixed", {
      amount: formatCurrency(ent.discount_value ?? 0, currency, language),
    });
  }
  if (ent.type === "package" || ent.type === "training") {
    const total = ent.total_sessions ?? 0;
    const remaining = Math.max(0, total - (ent.sessions_used ?? 0));
    return t("staffClientsPage.entSessionsLeft", { remaining, total });
  }
  if (ent.type === "gift_voucher") {
    return t("staffClientsPage.entVoucherLeft", {
      remaining: formatCurrency(ent.remaining_balance ?? 0, currency, language),
      original: formatCurrency(ent.original_value ?? 0, currency, language),
    });
  }
  return "";
}

function EntitlementCard({
  ent,
  currency,
  language,
  styles,
}: {
  ent: ClientEntitlement;
  currency: string;
  language: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useTranslation();
  const typeMeta = TYPE_META[ent.type];
  const statusStyle = ENT_STATUS_STYLE[ent.status] ?? ENT_STATUS_STYLE.used;
  const inactive = ent.status !== "active";
  const total = ent.total_sessions ?? 0;
  const used = ent.sessions_used ?? 0;
  const showProgress =
    (ent.type === "package" || ent.type === "training") && total > 0;
  const progressPct = showProgress ? Math.min(100, (used / total) * 100) : 0;

  return (
    <View style={[styles.entCard, inactive && styles.entCardInactive]}>
      <View style={styles.entTop}>
        <View
          style={[
            styles.entTypeBadge,
            {
              backgroundColor: typeMeta.bg,
              borderColor: typeMeta.border,
            },
          ]}>
          <Text style={[styles.entTypeText, { color: typeMeta.text }]}>
            {t(typeMeta.labelKey)}
          </Text>
        </View>
        <Text style={styles.entName} numberOfLines={1}>
          {ent.name}
        </Text>
        <View
          style={[
            styles.entStatusBadge,
            {
              backgroundColor: statusStyle.bg,
              borderColor: statusStyle.border,
            },
          ]}>
          <Text style={[styles.entStatusText, { color: statusStyle.text }]}>
            {t(`staffClientsPage.entStatus.${ent.status}`)}
          </Text>
        </View>
      </View>

      <Text style={styles.entSummary}>
        {entitlementSummary(ent, currency, language, t)}
      </Text>

      {showProgress ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
      ) : null}

      {ent.expires_at ? (
        <Text style={styles.entExpires}>
          {t("staffClientsPage.entExpires", {
            date: new Date(ent.expires_at).toLocaleDateString(language, {
              day: "numeric",
              month: "short",
              year: "2-digit",
            }),
          })}
        </Text>
      ) : null}
    </View>
  );
}

export function StaffClientDetailSheet({
  client,
  visible,
  currency,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const detailQ = useStaffClientDetail(visible && client ? client.id : null);
  const entitlementsQ = useClientEntitlements(
    visible && client ? client.id : null,
  );
  const updateNotes = useUpdateStaffClientNotes();
  const [tab, setTab] = useState<DetailTab>("info");
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
  const entitlements = entitlementsQ.data ?? [];

  function handleSaveNotes() {
    updateNotes.mutate(
      { clientId: client!.id, notes: noteText },
      {
        onSuccess: () =>
          toast.success(
            t("staffClientsPage.tabNotes"),
            t("staffClientsPage.notesSaved"),
          ),
        onError: (err: Error) =>
          toast.error(
            t("common.error"),
            err.message || t("staffClientsPage.notesSaveFailed"),
          ),
      },
    );
  }

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "info", label: t("staffClientsPage.tabInfo") },
    { key: "notes", label: t("staffClientsPage.tabNotes") },
    { key: "entitlements", label: t("staffClientsPage.tabEntitlements") },
  ];

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
                {formatCurrency(client.total_spent, currency, i18n.language)}
              </Text>
              <Text style={styles.metricLabel}>{t("staffClientsPage.spentLabel")}</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setTab(item.key)}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {detailQ.isLoading && tab !== "entitlements" ? (
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
          ) : tab === "notes" ? (
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
          ) : (
            <View style={styles.block}>
              <Text style={styles.entSectionTitle}>
                {t("staffClientsPage.entSectionTitle")}
              </Text>
              {entitlementsQ.isLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
              ) : entitlements.length === 0 ? (
                <View style={styles.entEmpty}>
                  <Text style={styles.empty}>{t("staffClientsPage.entEmpty")}</Text>
                  <Text style={styles.entEmptyHint}>
                    {t("staffClientsPage.entEmptyHint")}
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {entitlements.map((ent) => (
                    <EntitlementCard
                      key={ent.id}
                      ent={ent}
                      currency={currency}
                      language={i18n.language}
                      styles={styles}
                    />
                  ))}
                </View>
              )}
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
      gap: 6,
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
      paddingHorizontal: 4,
    },
    tabActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    tabText: {
      fontSize: 12,
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
      textAlign: "center",
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
    entSectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 10,
      fontFamily: ownerFonts.semiBold,
    },
    entEmpty: { paddingVertical: 24, gap: 4 },
    entEmptyHint: {
      fontSize: 12,
      color: colors.textDim,
      textAlign: "center",
      fontFamily: ownerFonts.regular,
    },
    entCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      gap: 6,
      backgroundColor: colors.bg,
    },
    entCardInactive: { opacity: 0.65 },
    entTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    entTypeBadge: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    entTypeText: {
      fontSize: 10,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    entName: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    entStatusBadge: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    entStatusText: {
      fontSize: 10,
      fontWeight: "600",
      textTransform: "capitalize",
      fontFamily: ownerFonts.semiBold,
    },
    entSummary: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: "hidden",
      marginTop: 2,
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    entExpires: {
      fontSize: 10,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
    },
  });
}
