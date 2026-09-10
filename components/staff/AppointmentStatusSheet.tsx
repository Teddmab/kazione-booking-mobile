import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import { clientDisplayName, formatTime } from "@/lib/format";
import {
  markArrived,
  markNotesReviewed,
  respondToAppointmentOffer,
  updateAppointmentNotes,
  updateAppointmentStatus,
  type AppointmentStatus,
  type PaymentMethod,
  type StaffAppointment,
} from "@/services/staff/appointments";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

const PAYMENT_KEYS: { value: PaymentMethod; labelKey: string }[] = [
  { value: "cash", labelKey: "staffAppt.payCash" },
  { value: "card", labelKey: "staffAppt.payCard" },
  { value: "bank_transfer", labelKey: "staffAppt.payTransfer" },
  { value: "voucher", labelKey: "staffAppt.payVoucher" },
  { value: "online", labelKey: "staffAppt.payOnline" },
];

interface Props {
  appointment: StaffAppointment | null;
  visible: boolean;
  onClose: () => void;
}

export function AppointmentStatusSheet({ appointment, visible, onClose }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const timeZone = tenant?.timezone ?? "Europe/Tallinn";
  const settings = useBusinessSettings(businessId);
  const arrivalTrackingEnabled =
    settings.data?.settings?.enable_arrival_tracking === true;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [noteText, setNoteText] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setError(null);
      setShowPayment(false);
      setPaymentMethod("cash");
      setNoteText(null);
    }
  }, [visible, appointment?.id]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["staff-appointments", businessId],
    });
    await queryClient.invalidateQueries({ queryKey: ["staff-offers"] });
    await queryClient.invalidateQueries({ queryKey: ["staff-pending-completion"] });
  };

  const statusMutation = useMutation({
    mutationFn: async (status: AppointmentStatus) => {
      if (!appointment) throw new Error("No appointment selected");
      return updateAppointmentStatus(businessId, appointment.id, status);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(t("staffAppt.toastTitle"), t("staffAppt.toastStatusUpdated"));
      onClose();
    },
    onError: (err: Error) => {
      const msg = err.message || t("staffAppt.errorUpdate");
      setError(msg);
      toast.error(t("staffAppt.toastError"), msg);
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
        t("staffAppt.toastTitle"),
        response === "accept"
          ? t("staffAppt.toastOfferAccepted")
          : t("staffAppt.toastOfferDeclined"),
      );
      onClose();
    },
    onError: (err: Error) => {
      const msg = err.message || t("staffAppt.errorOffer");
      setError(msg);
      toast.error(t("staffAppt.toastError"), msg);
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
      toast.success(t("staffAppt.toastTitle"), t("staffAppt.toastCompletePending"));
      onClose();
    },
    onError: (err: Error) => {
      const msg = err.message || t("staffAppt.errorComplete");
      setError(msg);
      toast.error(t("staffAppt.toastError"), msg);
    },
  });

  const notesMutation = useMutation({
    mutationFn: async (notes: string) => {
      if (!appointment) throw new Error("No appointment selected");
      return updateAppointmentNotes(businessId, appointment.id, notes);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(t("staffAppt.toastTitle"), t("staffAppt.toastNotesSaved"));
      setNoteText(null);
    },
    onError: (err: Error) => {
      const msg = err.message || t("staffAppt.errorNote");
      setError(msg);
      toast.error(t("staffAppt.toastError"), msg);
    },
  });

  if (!appointment) return null;

  const name = clientDisplayName(
    appointment.client.first_name,
    appointment.client.last_name,
  );
  const busy =
    statusMutation.isPending ||
    offerMutation.isPending ||
    completeMutation.isPending ||
    notesMutation.isPending;
  const intakeEntries = appointment.intake_answers
    ? Object.values(appointment.intake_answers)
    : [];
  const status = appointment.status;
  const canComplete =
    status === "pending" ||
    status === "confirmed" ||
    status === "arrived" ||
    status === "in_progress";
  const canNoShow =
    status === "pending" || status === "confirmed" || status === "arrived";
  const canMarkArrived =
    arrivalTrackingEnabled && status === "confirmed";
  const canStart =
    status === "pending" || status === "confirmed" || status === "arrived";
  const showOfferActions = status === "offered";
  const showInProgressExtras = status === "in_progress";
  const showWaiting = status === "pending_completion";
  const showSummary = status === "completed";
  const hasQuickActions =
    showOfferActions ||
    canMarkArrived ||
    canStart ||
    canComplete ||
    canNoShow ||
    showInProgressExtras ||
    showWaiting ||
    showSummary;

  function formatIntakeValue(value: unknown): string {
    if (value === true) return t("staffAppt.yes");
    if (value === false) return t("staffAppt.no");
    return String(value ?? "");
  }

  function confirmNoShow() {
    Alert.alert(
      t("staffAppt.confirmNoShowTitle"),
      t("staffAppt.confirmNoShowBody", { name }),
      [
        { text: t("staffAppt.cancel"), style: "cancel" },
        {
          text: t("staffAppt.actionNoShow"),
          style: "destructive",
          onPress: () => {
            setError(null);
            statusMutation.mutate("no_show");
          },
        },
      ],
    );
  }

  function confirmComplete() {
    Alert.alert(
      t("staffAppt.confirmCompleteTitle"),
      t("staffAppt.confirmCompleteBody"),
      [
        { text: t("staffAppt.cancel"), style: "cancel" },
        {
          text: t("staffAppt.continue"),
          onPress: () => {
            setError(null);
            setShowPayment(true);
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sheetTitle}>{t("staffAppt.sheetTitle")}</Text>

          <View style={styles.clientRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(appointment.client.first_name?.[0] ?? "") +
                  (appointment.client.last_name?.[0] ?? "")}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.client}>{name}</Text>
              {appointment.client.email ? (
                <Text style={styles.email}>{appointment.client.email}</Text>
              ) : null}
            </View>
            {appointment.referral_staff_id ? (
              <View style={styles.referralBadge}>
                <Text style={styles.referralText}>{t("staffAppt.viaReferral")}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>{t("staffAppt.labelService")}</Text>
              <Text style={styles.metaValue}>{appointment.service.name}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>{t("staffAppt.labelTime")}</Text>
              <Text style={styles.metaValue}>
                {formatTime(appointment.starts_at, "en", timeZone)}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>{t("staffAppt.labelDuration")}</Text>
              <Text style={styles.metaValue}>
                {appointment.service.duration_minutes} min
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>{t("staffAppt.labelStatus")}</Text>
              <View style={{ marginTop: 4 }}>
                <StatusBadge
                  status={appointment.status}
                  startsAt={appointment.starts_at}
                  endsAt={appointment.ends_at}
                />
              </View>
            </View>
          </View>

          {appointment.notes ? (
            <View style={styles.notesReadonly}>
              <Text style={styles.notesTitle}>{t("staffAppt.appointmentNotes")}</Text>
              <Text style={styles.notesBody}>{appointment.notes}</Text>
            </View>
          ) : null}

          {intakeEntries.length > 0 ? (
            <View style={styles.intakeBlock}>
              <Text style={styles.intakeTitle}>{t("staffAppt.clientIntake")}</Text>
              {intakeEntries.map((entry, i) => {
                const val = entry.value;
                const isImage =
                  typeof val === "string" && val.startsWith("data:image");
                return (
                  <View key={`${entry.label}-${i}`} style={styles.intakeRow}>
                    <Text style={styles.intakeLabel}>{entry.label}</Text>
                    {isImage ? (
                      <Image source={{ uri: val as string }} style={styles.intakeImage} />
                    ) : (
                      <Text style={styles.intakeValue}>{formatIntakeValue(val)}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.actionsSection}>
            <Text style={styles.actionsTitle}>{t("staffAppt.quickActions")}</Text>

            {showPayment ? (
              <View style={styles.paymentBlock}>
                <Text style={styles.paymentHint}>{t("staffAppt.paymentHint")}</Text>
                <View style={styles.paymentGrid}>
                  {PAYMENT_KEYS.map((method) => {
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
                          {t(method.labelKey)}
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
                    <Text style={styles.actionText}>{t("staffAppt.submitOwner")}</Text>
                  )}
                </Pressable>
                <Pressable
                  style={styles.closeBtn}
                  onPress={() => setShowPayment(false)}
                  disabled={busy}>
                  <Text style={styles.closeText}>{t("staffAppt.cancel")}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actionsGrid}>
                {showOfferActions ? (
                  <>
                    <Pressable
                      style={[styles.actionBtn, styles.actionPrimary, busy && styles.actionDisabled]}
                      disabled={busy}
                      onPress={() => {
                        setError(null);
                        offerMutation.mutate("accept");
                      }}>
                      {offerMutation.isPending && offerMutation.variables === "accept" ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.actionText}>{t("staffAppt.actionAccept")}</Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.actionDanger, busy && styles.actionDisabled]}
                      disabled={busy}
                      onPress={() => {
                        setError(null);
                        offerMutation.mutate("decline");
                      }}>
                      {offerMutation.isPending && offerMutation.variables === "decline" ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.actionText}>{t("staffAppt.actionDecline")}</Text>
                      )}
                    </Pressable>
                  </>
                ) : null}

                {canMarkArrived ? (
                  <Pressable
                    style={[styles.actionBtn, styles.actionPrimary, busy && styles.actionDisabled]}
                    disabled={busy || statusMutation.isPending}
                    onPress={() => {
                      setError(null);
                      void markArrived(appointment.id)
                        .then(async () => {
                          await invalidate();
                          toast.success(
                            t("staffAppt.toastTitle"),
                            t("staffToday.markArrived"),
                          );
                          onClose();
                        })
                        .catch((err: Error) => {
                          setError(err.message);
                          toast.error(t("staffAppt.toastError"), err.message);
                        });
                    }}>
                    <Text style={styles.actionText}>{t("staffToday.markArrived")}</Text>
                  </Pressable>
                ) : null}

                {canStart ? (
                  <Pressable
                    style={[styles.actionBtn, styles.actionPrimary, busy && styles.actionDisabled]}
                    disabled={busy}
                    onPress={() => {
                      setError(null);
                      statusMutation.mutate("in_progress");
                    }}>
                    <Text style={styles.actionText}>{t("staffToday.startNext")}</Text>
                  </Pressable>
                ) : null}

                {canComplete ? (
                  <Pressable
                    style={[styles.actionBtn, styles.actionPrimary, busy && styles.actionDisabled]}
                    disabled={busy}
                    onPress={confirmComplete}>
                    <Text style={styles.actionText}>{t("staffAppt.actionComplete")}</Text>
                  </Pressable>
                ) : null}

                {canNoShow ? (
                  <Pressable
                    style={[styles.actionBtn, styles.actionOutline, busy && styles.actionDisabled]}
                    disabled={busy}
                    onPress={confirmNoShow}>
                    <Text style={styles.actionOutlineText}>{t("staffAppt.actionNoShow")}</Text>
                  </Pressable>
                ) : null}

                {showInProgressExtras ? (
                  <Pressable
                    style={[styles.actionBtn, styles.actionOutline, busy && styles.actionDisabled]}
                    disabled={busy}
                    onPress={() => setNoteText(appointment.notes ?? "")}>
                    <Text style={styles.actionOutlineText}>{t("staffAppt.actionAddNote")}</Text>
                  </Pressable>
                ) : null}

                {showWaiting ? (
                  <View style={styles.waitingBox}>
                    <Text style={styles.waitingText}>{t("staffAppt.waitingOwner")}</Text>
                  </View>
                ) : null}

                {showSummary ? (
                  <Pressable
                    style={[styles.actionBtn, styles.actionOutline]}
                    onPress={() => {
                      onClose();
                      router.push("/(app)/staff/(tabs)/performance" as Href);
                    }}>
                    <Text style={styles.actionOutlineText}>
                      {t("staffAppt.actionViewSummary")}
                    </Text>
                  </Pressable>
                ) : null}

                {!hasQuickActions ? (
                  <Text style={styles.readonly}>{t("staffAppt.hintNoActions")}</Text>
                ) : null}
              </View>
            )}
          </View>

          {status === "in_progress" && noteText !== null ? (
            <View style={styles.notesBlock}>
              <Text style={styles.notesTitle}>{t("staffAppt.noteTitle")}</Text>
              <TextInput
                style={styles.notesInput}
                value={noteText}
                onChangeText={setNoteText}
                placeholder={t("staffAppt.notePh")}
                placeholderTextColor={colors.textDim}
                multiline
                textAlignVertical="top"
                editable={!busy}
              />
              <Pressable
                style={[
                  styles.saveNotesBtn,
                  (busy || noteText === (appointment.notes ?? "")) && styles.actionDisabled,
                ]}
                disabled={busy || noteText === (appointment.notes ?? "")}
                onPress={() => {
                  setError(null);
                  notesMutation.mutate(noteText);
                }}>
                {notesMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.actionText}>{t("staffAppt.saveNote")}</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!showPayment ? (
            <Pressable style={styles.closeBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.closeText}>{t("staffAppt.close")}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
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
      maxHeight: "92%",
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
      marginBottom: 12,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
      marginBottom: 14,
    },
    clientRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 14,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: colors.primary,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
      fontSize: 14,
    },
    client: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    email: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    referralBadge: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    referralText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    metaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 12,
    },
    metaCell: {
      width: "47%",
      flexGrow: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
    },
    metaLabel: {
      fontSize: 10,
      color: colors.textDim,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontFamily: ownerFonts.medium,
    },
    metaValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginTop: 4,
      fontFamily: ownerFonts.semiBold,
    },
    notesReadonly: {
      backgroundColor: colors.warningMuted,
      borderWidth: 1,
      borderColor: colors.warning + "44",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      gap: 4,
    },
    notesBlock: {
      marginTop: 8,
      marginBottom: 12,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    notesTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    notesBody: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    notesInput: {
      minHeight: 72,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.bg,
      fontFamily: ownerFonts.regular,
    },
    saveNotesBtn: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minWidth: 140,
      alignItems: "center",
    },
    intakeBlock: {
      backgroundColor: colors.primarySurface,
      borderWidth: 1,
      borderColor: colors.primary + "33",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      gap: 10,
    },
    intakeTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
    intakeRow: { gap: 2 },
    intakeLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    intakeValue: {
      fontSize: 14,
      color: colors.text,
      fontFamily: ownerFonts.regular,
    },
    intakeImage: {
      marginTop: 6,
      width: "100%",
      height: 160,
      borderRadius: 10,
      backgroundColor: colors.bg,
    },
    actionsSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
      marginTop: 4,
    },
    actionsTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 10,
      fontFamily: ownerFonts.semiBold,
    },
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    readonly: {
      fontSize: 14,
      color: colors.textDim,
      marginVertical: 8,
      fontFamily: ownerFonts.regular,
      width: "100%",
    },
    actionBtn: {
      minHeight: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
      flexGrow: 1,
      minWidth: "46%",
    },
    actionPrimary: { backgroundColor: colors.primary },
    actionDanger: { backgroundColor: colors.danger },
    actionOutline: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionDisabled: { opacity: 0.7 },
    actionText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
      textAlign: "center",
    },
    actionOutlineText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
      textAlign: "center",
    },
    waitingBox: {
      width: "100%",
      backgroundColor: colors.warningMuted,
      borderWidth: 1,
      borderColor: colors.warning + "55",
      borderRadius: 10,
      padding: 12,
    },
    waitingText: {
      fontSize: 13,
      color: colors.warning,
      fontFamily: ownerFonts.medium,
    },
    paymentBlock: { marginTop: 4, gap: 12, width: "100%" },
    paymentHint: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    paymentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    paymentChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.bg,
    },
    paymentChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    paymentChipText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    paymentChipTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      marginTop: 10,
      fontFamily: ownerFonts.regular,
    },
    closeBtn: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
    closeText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textMuted,
      fontFamily: ownerFonts.semiBold,
    },
  });
}
