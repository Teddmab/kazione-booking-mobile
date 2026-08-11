import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { formatCurrency } from "@/lib/format";
import {
  commissionEarnings,
  commissionLabel,
} from "@/lib/commissionLabel";
import type { StaffService } from "@/services/staff/services";

interface Props {
  service: StaffService | null;
  visible: boolean;
  referralLink: string | null;
  onClose: () => void;
  onShare: () => Promise<void>;
  sharing?: boolean;
}

export function ServiceDetailSheet({
  service,
  visible,
  referralLink,
  onClose,
  onShare,
  sharing,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) setBusy(false);
  }, [visible, service?.id]);

  if (!service) return null;

  const currency = service.currency_code || "EUR";
  const price = service.effective_price ?? service.price;
  const type =
    service.offered_commission_type ?? service.staff_commission_type ?? null;
  const value =
    service.offered_commission_value ?? service.staff_commission_value ?? null;
  const earnings = commissionEarnings(type, value, price);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {service.image_url || service.image_url_2 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageRow}>
              {service.image_url ? (
                <Image source={{ uri: service.image_url }} style={styles.image} />
              ) : null}
              {service.image_url_2 ? (
                <Image source={{ uri: service.image_url_2 }} style={styles.image} />
              ) : null}
            </ScrollView>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>✂</Text>
            </View>
          )}

          <Text style={styles.name}>{service.name}</Text>
          {service.category_name ? (
            <Text style={styles.category}>{service.category_name}</Text>
          ) : null}

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("staffServiceDetail.duration")}</Text>
              <Text style={styles.metaValue}>{service.duration_minutes} min</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("staffServiceDetail.price")}</Text>
              <Text style={styles.metaValue}>{formatCurrency(price, currency)}</Text>
            </View>
            {earnings != null ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t("staffServiceDetail.commission")}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.metaValuePrimary}>
                    {formatCurrency(earnings, currency)}
                  </Text>
                  <Text style={styles.metaHint}>
                    {commissionLabel(type, value, currency)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t("staffServiceDetail.commission")}</Text>
                <Text style={styles.metaValue}>
                  {commissionLabel(type, value, currency)}
                </Text>
              </View>
            )}
          </View>

          {service.description ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>{t("staffServiceDetail.about")}</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          ) : null}

          {referralLink ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>{t("staffServiceDetail.referralLink")}</Text>
              <Text style={styles.linkHint} numberOfLines={2}>
                {referralLink}
              </Text>
              <Pressable
                style={[styles.shareBtn, (busy || sharing) && styles.disabled]}
                disabled={busy || sharing}
                onPress={() => {
                  setBusy(true);
                  void onShare().finally(() => setBusy(false));
                }}>
                {busy || sharing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.shareText}>{t("staffServiceDetail.shareLink")}</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>{t("common.close")}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

export async function shareReferralUrl(url: string): Promise<void> {
  await Share.share({ message: url, url });
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
    image: {
      width: 280,
      height: 160,
      borderRadius: 14,
      backgroundColor: colors.bg,
    },
    imageRow: {
      gap: 10,
      marginBottom: 14,
    },
    imagePlaceholder: {
      width: "100%",
      height: 120,
      borderRadius: 14,
      marginBottom: 14,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    imagePlaceholderText: { fontSize: 36 },
    name: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    category: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
      marginBottom: 12,
      fontFamily: ownerFonts.medium,
    },
    metaCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.bg,
      marginBottom: 14,
      overflow: "hidden",
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    metaLabel: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    metaValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    metaValuePrimary: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
    metaHint: {
      fontSize: 11,
      color: colors.textDim,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    block: { marginBottom: 16 },
    blockTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textDim,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6,
      fontFamily: ownerFonts.bold,
    },
    description: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
      fontFamily: ownerFonts.regular,
    },
    linkHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 10,
      fontFamily: ownerFonts.regular,
    },
    shareBtn: {
      backgroundColor: colors.primary,
      height: 46,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    shareText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    disabled: { opacity: 0.7 },
    closeBtn: { alignItems: "center", paddingVertical: 14 },
    closeText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textMuted,
      fontFamily: ownerFonts.semiBold,
    },
  });
}
