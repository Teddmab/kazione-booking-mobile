import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { localeForLanguage } from "@/lib/format";
import {
  extractVoucherUuid,
  staffRedeemVoucher,
  verifyVoucher,
  type VoucherVerifyResult,
} from "@/services/staff/vouchers";

type InputTab = "camera" | "image" | "paste";

interface Props {
  visible: boolean;
  onClose: () => void;
}

function money(amount: number, currency: string, language: string): string {
  return new Intl.NumberFormat(localeForLanguage(language), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function StatusPill({
  status,
  styles,
}: {
  status: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useTranslation();
  const active = status === "active";
  const done = status === "completed";
  return (
    <View
      style={[
        styles.pill,
        active && styles.pillActive,
        done && styles.pillDone,
        !active && !done && styles.pillOther,
      ]}>
      <Text
        style={[
          styles.pillText,
          active && styles.pillTextActive,
          done && styles.pillTextDone,
        ]}>
        {active ? t("staffVoucher.active") : done ? t("staffVoucher.used") : status}
      </Text>
    </View>
  );
}

export function VoucherScanSheet({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [tab, setTab] = useState<InputTab>("camera");
  const [input, setInput] = useState("");
  const [lookupId, setLookupId] = useState<string | null>(null);
  const [scannedLock, setScannedLock] = useState(false);

  const inputTabs = useMemo(
    () =>
      [
        { id: "camera" as const, label: t("staffVoucher.camera"), icon: "camera-outline" },
        { id: "image" as const, label: t("staffVoucher.image"), icon: "image-outline" },
        { id: "paste" as const, label: t("staffVoucher.paste"), icon: "keypad-outline" },
      ] as const,
    [t],
  );

  useEffect(() => {
    if (!visible) {
      setInput("");
      setLookupId(null);
      setScannedLock(false);
      setTab("camera");
    }
  }, [visible]);

  const voucherQ = useQuery({
    queryKey: ["scan-voucher", lookupId],
    queryFn: () => verifyVoucher(lookupId!),
    enabled: !!lookupId,
    retry: false,
  });

  const redeem = useMutation({
    mutationFn: (id: string) => staffRedeemVoucher(id),
    onSuccess: () => {
      toast.success(t("staffVoucher.title"), t("staffVoucher.markedUsed"));
      void qc.invalidateQueries({ queryKey: ["scan-voucher"] });
      setLookupId(null);
      setInput("");
      setScannedLock(false);
    },
    onError: (err: Error) =>
      toast.error(t("common.error"), err.message || t("common.error")),
  });

  function applyScan(raw: string) {
    const id = extractVoucherUuid(raw);
    if (!id) {
      toast.warning(t("staffVoucher.notFound"), t("staffVoucher.invalidCode"));
      return;
    }
    setLookupId(id);
    setScannedLock(true);
  }

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (res.canceled || !res.assets[0]) return;
    toast.warning(t("staffVoucher.imageSelected"), t("staffVoucher.imageSelectedHint"));
    setTab("paste");
  }

  function reset() {
    setLookupId(null);
    setInput("");
    setScannedLock(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  const voucher = voucherQ.data as VoucherVerifyResult | undefined;
  const balance =
    voucher != null
      ? (voucher.voucher_value ?? 0) - (voucher.voucher_used ?? 0)
      : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
          <Text style={styles.title}>{t("staffVoucher.title")}</Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled">
          {!lookupId ? (
            <>
              <View style={styles.tabs}>
                {inputTabs.map((tabItem) => (
                  <Pressable
                    key={tabItem.id}
                    style={[styles.tab, tab === tabItem.id && styles.tabActive]}
                    onPress={() => {
                      setTab(tabItem.id);
                      setScannedLock(false);
                    }}>
                    <Ionicons
                      name={tabItem.icon}
                      size={14}
                      color={tab === tabItem.id ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        tab === tabItem.id && styles.tabTextActive,
                      ]}>
                      {tabItem.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {tab === "camera" ? (
                <View style={styles.cameraBox}>
                  {!permission?.granted ? (
                    <View style={styles.cameraFallback}>
                      <Text style={styles.fallbackText}>
                        {t("staffVoucher.authorizeHint")}
                      </Text>
                      <Pressable
                        style={styles.primaryBtn}
                        onPress={() => void requestPermission()}>
                        <Text style={styles.primaryBtnText}>{t("staffVoucher.authorize")}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <CameraView
                      style={StyleSheet.absoluteFill}
                      facing="back"
                      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                      onBarcodeScanned={
                        scannedLock
                          ? undefined
                          : ({ data }) => {
                              applyScan(data);
                            }
                      }
                    />
                  )}
                  <Text style={styles.cameraHint}>{t("staffVoucher.pointCamera")}</Text>
                </View>
              ) : null}

              {tab === "image" ? (
                <Pressable style={styles.imageBox} onPress={() => void pickImage()}>
                  <Ionicons
                    name="image-outline"
                    size={32}
                    color={colors.textMuted}
                  />
                  <Text style={styles.imageTitle}>{t("staffVoucher.pickPhoto")}</Text>
                  <Text style={styles.imageHint}>{t("staffVoucher.pasteIfNeeded")}</Text>
                </Pressable>
              ) : null}

              {tab === "paste" ? (
                <View style={styles.pasteRow}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("staffVoucher.pastePh")}
                    placeholderTextColor={colors.textDim}
                    value={input}
                    onChangeText={setInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    style={[
                      styles.searchBtn,
                      !input.trim() && styles.disabled,
                    ]}
                    disabled={!input.trim()}
                    onPress={() => applyScan(input)}>
                    <Ionicons name="search" size={18} color="#fff" />
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : null}

          {lookupId && voucherQ.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.muted}>{t("staffVoucher.searching")}</Text>
            </View>
          ) : null}

          {lookupId && voucherQ.isError && !voucherQ.isLoading ? (
            <View style={styles.errorBox}>
              <Ionicons name="close-circle" size={28} color={colors.danger} />
              <Text style={styles.errorTitle}>{t("staffVoucher.notFound")}</Text>
              <Text style={styles.muted}>{t("staffVoucher.invalidCode")}</Text>
              <Pressable style={styles.outlineBtn} onPress={reset}>
                <Text style={styles.outlineBtnText}>{t("staffVoucher.scanAnother")}</Text>
              </Pressable>
            </View>
          ) : null}

          {voucher && !voucherQ.isLoading ? (
            <View style={styles.result}>
              <View style={styles.resultHero}>
                <Text style={styles.resultBiz}>
                  {voucher.business_name ?? t("staffVoucher.defaultSalon")}
                </Text>
                <Text style={styles.resultTitle}>
                  {voucher.offer_title ?? t("staffVoucher.defaultVoucher")}
                </Text>
                {voucher.client_first_name ? (
                  <Text style={styles.resultClient}>
                    {t("staffVoucher.forClient", { name: voucher.client_first_name })}
                  </Text>
                ) : null}
              </View>

              <View style={styles.resultBody}>
                <StatusPill status={voucher.status} styles={styles} />

                {voucher.offer_type === "gift_voucher" ? (
                  <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>{t("staffVoucher.balance")}</Text>
                    <Text style={styles.balanceValue}>
                      {money(balance, voucher.currency_code ?? "EUR", i18n.language)}
                    </Text>
                    <Text style={styles.muted}>
                      {t("staffVoucher.ofTotal", {
                        amount: money(
                          voucher.voucher_value ?? 0,
                          voucher.currency_code ?? "EUR",
                          i18n.language,
                        ),
                      })}
                    </Text>
                  </View>
                ) : null}

                {voucher.offer_type === "package" ||
                voucher.offer_type === "training" ? (
                  <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>{t("staffVoucher.sessionsLeft")}</Text>
                    <Text style={styles.balanceValue}>
                      {(voucher.sessions_total ?? 0) -
                        (voucher.sessions_used ?? 0)}
                      <Text style={styles.muted}>
                        {" "}
                        / {voucher.sessions_total}
                      </Text>
                    </Text>
                  </View>
                ) : null}

                <View style={styles.resultActions}>
                  <Pressable style={styles.outlineBtnFlex} onPress={reset}>
                    <Text style={styles.outlineBtnText}>{t("staffVoucher.scanAnother")}</Text>
                  </Pressable>
                  {voucher.status === "active" ? (
                    <Pressable
                      style={[
                        styles.primaryBtnFlex,
                        redeem.isPending && styles.disabled,
                      ]}
                      disabled={redeem.isPending}
                      onPress={() => redeem.mutate(lookupId!)}>
                      {redeem.isPending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryBtnText}>
                          {t("staffVoucher.markUsed")}
                        </Text>
                      )}
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    title: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    body: { padding: 16, gap: 14 },
    tabs: {
      flexDirection: "row",
      backgroundColor: colors.cardWarm,
      borderRadius: 10,
      padding: 4,
      gap: 4,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 8,
      borderRadius: 8,
    },
    tabActive: { backgroundColor: colors.card },
    tabText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    tabTextActive: { color: colors.primary, fontWeight: "600" },
    cameraBox: {
      height: 280,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#111",
    },
    cameraFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      gap: 12,
    },
    cameraHint: {
      position: "absolute",
      bottom: 12,
      left: 0,
      right: 0,
      textAlign: "center",
      color: "rgba(255,255,255,0.75)",
      fontSize: 12,
    },
    imageBox: {
      height: 220,
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.cardWarm,
    },
    imageTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    imageHint: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
      paddingHorizontal: 24,
    },
    pasteRow: { flexDirection: "row", gap: 8 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.card,
      fontFamily: ownerFonts.regular,
    },
    searchBtn: {
      width: 48,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    center: { alignItems: "center", gap: 10, paddingVertical: 32 },
    muted: { fontSize: 13, color: colors.textMuted, fontFamily: ownerFonts.regular },
    errorBox: {
      alignItems: "center",
      gap: 8,
      padding: 20,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.dangerMuted,
      backgroundColor: colors.dangerMuted,
    },
    errorTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.danger,
      fontFamily: ownerFonts.bold,
    },
    result: {
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultHero: {
      backgroundColor: "#1A0F0A",
      padding: 16,
      gap: 4,
    },
    resultBiz: {
      fontSize: 11,
      color: "rgba(255,255,255,0.55)",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    resultTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
      fontFamily: ownerFonts.bold,
    },
    resultClient: { fontSize: 13, color: "rgba(255,255,255,0.65)" },
    resultBody: { padding: 16, gap: 14, backgroundColor: colors.card },
    pill: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },
    pillActive: {
      backgroundColor: "#ECFDF5",
      borderColor: "#A7F3D0",
    },
    pillDone: { backgroundColor: "#F4F4F5", borderColor: "#E4E4E7" },
    pillOther: {
      backgroundColor: colors.warningMuted,
      borderColor: "#FDE68A",
    },
    pillText: { fontSize: 11, fontWeight: "600", fontFamily: ownerFonts.semiBold },
    pillTextActive: { color: "#047857" },
    pillTextDone: { color: "#71717A" },
    balanceBox: {
      backgroundColor: colors.cardWarm,
      borderRadius: 12,
      padding: 14,
    },
    balanceLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
      color: colors.textMuted,
    },
    balanceValue: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
      marginTop: 4,
      fontFamily: ownerFonts.extraBold,
    },
    resultActions: { flexDirection: "row", gap: 8 },
    outlineBtn: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    outlineBtnFlex: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    outlineBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    primaryBtnFlex: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    fallbackText: {
      color: "#fff",
      textAlign: "center",
      fontSize: 13,
      marginBottom: 8,
    },
    disabled: { opacity: 0.55 },
  });
}
