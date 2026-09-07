import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import {
  ServiceDetailSheet,
  shareReferralUrl,
} from "@/components/staff/ServiceDetailSheet";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useRespondToServiceOffer,
  useStaffServices,
} from "@/hooks/useStaffServices";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import {
  commissionEarnings,
} from "@/lib/commissionLabel";
import { formatCurrency } from "@/lib/format";
import {
  buildStaffReferralLink,
  useStaffReferralLink,
} from "@/lib/referralLink";
import type { StaffService } from "@/services/staff/services";

type StatusFilter = "all" | "active" | "pending";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}`;
}

function ServiceThumb({
  uri,
  styles,
  colors,
}: {
  uri: string | null;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.thumb}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View style={[styles.thumb, styles.thumbFallback]}>
      <Ionicons name="cut-outline" size={18} color={colors.primary} />
    </View>
  );
}

function ActiveServiceCard({
  service,
  onOpen,
  onManageAvailability,
  onMenu,
  styles,
  colors,
}: {
  service: StaffService;
  onOpen: () => void;
  onManageAvailability: () => void;
  onMenu: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const { t } = useTranslation();
  const currency = service.currency_code || "EUR";
  const price = service.effective_price ?? service.price;
  const type =
    service.offered_commission_type ?? service.staff_commission_type ?? null;
  const value =
    service.offered_commission_value ?? service.staff_commission_value ?? null;
  const earnings = commissionEarnings(type, value, price);
  const rateLabel =
    type === "percentage" && value != null
      ? `${value} %`
      : type === "fixed" && value != null
        ? formatCurrency(value, currency)
        : "—";

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardHead} onPress={onOpen}>
        <ServiceThumb uri={service.image_url} styles={styles} colors={colors} />
        <View style={styles.cardHeadBody}>
          <Text style={styles.svcName} numberOfLines={1}>
            {service.name}
          </Text>
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.durationText}>
              {formatDuration(service.duration_minutes)}
            </Text>
          </View>
        </View>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>{t("staffServices.active")}</Text>
        </View>
        <Pressable onPress={onMenu} hitSlop={10} style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
        </Pressable>
      </Pressable>

      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <View style={styles.metricLabelRow}>
            <Text style={styles.metricLabel}>{t("staffServices.salonPrice")}</Text>
            <Ionicons name="lock-closed" size={10} color={colors.textDim} />
          </View>
          <Text style={styles.metricValue}>
            {formatCurrency(price, currency)}
          </Text>
          <View style={styles.pricePill}>
            <Text style={styles.pricePillText}>
              {t("staffServices.salonPriceHint")}
            </Text>
          </View>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>
            {t("staffServices.commissionRate")}
          </Text>
          <Text style={styles.metricValue}>{rateLabel}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>
            {t("staffServices.estimatedCommission")}
          </Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            {earnings != null ? formatCurrency(earnings, currency) : "—"}
          </Text>
          <Text style={styles.metricHint}>
            {t("staffServices.perService")}
          </Text>
        </View>
      </View>

      <Pressable style={styles.cardFooter} onPress={onManageAvailability}>
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        <Text style={styles.cardFooterText}>
          {t("staffServices.manageAvailability")}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function PendingServiceCard({
  service,
  busy,
  onVerify,
  onMenu,
  styles,
  colors,
}: {
  service: StaffService;
  busy: boolean;
  onVerify: () => void;
  onMenu: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.warnThumb}>
          <Ionicons name="warning" size={20} color="#D97706" />
        </View>
        <View style={styles.cardHeadBody}>
          <Text style={styles.svcName} numberOfLines={1}>
            {service.name}
          </Text>
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.durationText}>
              {formatDuration(service.duration_minutes)}
            </Text>
          </View>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>
            {t("staffServices.toVerify")}
          </Text>
        </View>
        <Pressable onPress={onMenu} hitSlop={10} style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.verifyBox}>
        <Text style={styles.verifyTitle}>
          {t("staffServices.verifyTitle")}
        </Text>
        <Text style={styles.verifyBody}>
          {t("staffServices.verifyBody")}
        </Text>
        <Pressable
          style={[styles.verifyBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={onVerify}>
          <Text style={styles.verifyBtnText}>
            {t("staffServices.verifyCta")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function StaffServicesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tenant } = useTenantContext();
  const { data: self } = useStaffSelf();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useStaffServices();
  const respond = useRespondToServiceOffer();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<StaffService | null>(null);
  const [menuService, setMenuService] = useState<StaffService | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const selectedLink = useStaffReferralLink(selected?.id);

  const services = data ?? [];
  const pending = useMemo(
    () => services.filter((s) => s.assignment_status === "pending"),
    [services],
  );
  const accepted = useMemo(
    () =>
      services.filter(
        (s) => s.assignment_status === "accepted" && s.is_active !== false,
      ),
    [services],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const pool =
      filter === "pending"
        ? pending
        : filter === "active"
          ? accepted
          : [...accepted, ...pending];

    return pool.filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [accepted, pending, filter, search]);

  function referralUrl(serviceId?: string): string | null {
    const slug = tenant?.slug;
    const staffProfileId =
      self?.staff_profile_id ?? tenant?.staffProfileId ?? null;
    if (!slug || !staffProfileId) return null;
    return buildStaffReferralLink(slug, staffProfileId, {
      businessType: tenant?.businessType,
      serviceId,
    });
  }

  function handleRespond(svc: StaffService, response: "accepted" | "declined") {
    setRespondingId(svc.id);
    respond.mutate(
      { serviceId: svc.id, response },
      {
        onSuccess: () => {
          setSelected(null);
          setMenuService(null);
          toast.success(
            t("staffServices.toastOfferTitle"),
            response === "accepted"
              ? t("staffServices.toastAccepted")
              : t("staffServices.toastDeclined"),
          );
        },
        onError: (err: Error) => {
          toast.error(
            t("staffServices.toastError"),
            err.message || t("staffServices.toastRespondError"),
          );
        },
        onSettled: () => setRespondingId(null),
      },
    );
  }

  async function shareFor(serviceId?: string) {
    const url = referralUrl(serviceId);
    if (!url) {
      toast.warning(t("staffServices.shareTitle"), t("staffServices.shareNoLink"));
      return;
    }
    try {
      await shareReferralUrl(url);
    } catch (err) {
      toast.error(
        t("staffServices.shareTitle"),
        err instanceof Error ? err.message : t("staffServices.shareFailed"),
      );
    }
  }

  const chips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("staffServices.all") },
    { key: "active", label: t("staffServices.activeFilter") },
    { key: "pending", label: t("staffServices.toVerify") },
  ];

  return (
    <View style={styles.screen}>
      <StaffAppBar title={t("staffServices.title")} displayTitle />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textDim} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t("staffServices.searchPh")}
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
          />
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {chips.map((chip) => {
            const active = filter === chip.key;
            return (
              <Pressable
                key={chip.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(chip.key)}>
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          empty={!isLoading && filtered.length === 0}
          emptyMessage={t("staffServices.empty")}
          onRetry={() => void refetch()}>
          {filtered.map((svc) =>
            svc.assignment_status === "pending" ? (
              <PendingServiceCard
                key={svc.id}
                service={svc}
                busy={respondingId === svc.id || respond.isPending}
                onVerify={() => setSelected(svc)}
                onMenu={() => setMenuService(svc)}
                styles={styles}
                colors={colors}
              />
            ) : (
              <ActiveServiceCard
                key={svc.id}
                service={svc}
                onOpen={() => setSelected(svc)}
                onManageAvailability={() =>
                  router.push("/(app)/staff/(tabs)/profile" as Href)
                }
                onMenu={() => setMenuService(svc)}
                styles={styles}
                colors={colors}
              />
            ),
          )}
        </QueryState>
      </ScrollView>

      <ServiceDetailSheet
        service={selected}
        visible={!!selected}
        referralLink={selectedLink}
        onClose={() => setSelected(null)}
        offerBusy={respondingId === selected?.id || respond.isPending}
        onAcceptOffer={
          selected?.assignment_status === "pending"
            ? () => handleRespond(selected, "accepted")
            : undefined
        }
        onDeclineOffer={
          selected?.assignment_status === "pending"
            ? () => handleRespond(selected, "declined")
            : undefined
        }
        onShare={async () => {
          await shareFor(selected?.id);
        }}
      />

      {/* Quick actions for pending offer from detail/menu */}
      <Modal
        visible={!!menuService}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuService(null)}>
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuService(null)}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {menuService?.name}
            </Text>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                const svc = menuService;
                setMenuService(null);
                if (svc) setSelected(svc);
              }}>
              <Ionicons name="eye-outline" size={18} color={colors.text} />
              <Text style={styles.menuRowText}>
                {t("staffServices.viewDetails")}
              </Text>
            </Pressable>
            {menuService?.assignment_status === "accepted" ? (
              <Pressable
                style={styles.menuRow}
                onPress={() => {
                  setMenuService(null);
                  void shareFor(menuService.id);
                }}>
                <Ionicons name="share-outline" size={18} color={colors.text} />
                <Text style={styles.menuRowText}>
                  {t("staffServices.shareTitle")}
                </Text>
              </Pressable>
            ) : null}
            {menuService?.assignment_status === "pending" ? (
              <>
                <Pressable
                  style={styles.menuRow}
                  onPress={() => {
                    const svc = menuService;
                    setMenuService(null);
                    if (svc) handleRespond(svc, "accepted");
                  }}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={colors.success}
                  />
                  <Text style={[styles.menuRowText, { color: colors.success }]}>
                    {t("staffServices.accept")}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.menuRow}
                  onPress={() => {
                    const svc = menuService;
                    setMenuService(null);
                    if (svc) handleRespond(svc, "declined");
                  }}>
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={colors.danger}
                  />
                  <Text style={[styles.menuRowText, { color: colors.danger }]}>
                    {t("staffServices.decline")}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40, gap: 12 },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      fontFamily: ownerFonts.regular,
      paddingVertical: 0,
    },
    chips: { flexDirection: "row", gap: 8 },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.primary + "66",
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    chipTextActive: { color: "#fff" },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      overflow: "hidden",
    },
    cardHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
    },
    cardHeadBody: { flex: 1, minWidth: 0 },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: colors.bg,
    },
    thumbFallback: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySurface,
    },
    warnThumb: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#FFEDD5",
      alignItems: "center",
      justifyContent: "center",
    },
    svcName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    durationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 3,
    },
    durationText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    activeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#ECFDF5",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#10B981",
    },
    activeBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#059669",
      fontFamily: ownerFonts.bold,
    },
    pendingBadge: {
      backgroundColor: "#FEF3C7",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pendingBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#B45309",
      fontFamily: ownerFonts.bold,
    },
    menuBtn: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    metricsRow: {
      flexDirection: "row",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    metricCol: {
      flex: 1,
      paddingHorizontal: 6,
      gap: 3,
    },
    metricDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    metricLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metricLabel: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    metricValue: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    metricHint: {
      fontSize: 9,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
    },
    pricePill: {
      alignSelf: "flex-start",
      backgroundColor: colors.primarySurface,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginTop: 2,
    },
    pricePillText: {
      fontSize: 9,
      color: colors.primary,
      fontFamily: ownerFonts.medium,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    cardFooterText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    verifyBox: {
      marginHorizontal: 12,
      marginBottom: 12,
      backgroundColor: "#FFF7ED",
      borderRadius: 12,
      padding: 12,
      gap: 6,
    },
    verifyTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#9A3412",
      fontFamily: ownerFonts.bold,
    },
    verifyBody: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
      fontFamily: ownerFonts.regular,
    },
    verifyBtn: {
      alignSelf: "flex-end",
      marginTop: 6,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    verifyBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
    disabled: { opacity: 0.55 },
    menuBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    menuSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
      gap: 4,
      paddingBottom: 28,
    },
    menuTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
      fontFamily: ownerFonts.bold,
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
    },
    menuRowText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
  });
}
