import { useMemo, useState } from "react";
import {
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
import { useTranslation } from "react-i18next";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import {
  ServiceDetailSheet,
  shareReferralUrl,
} from "@/components/staff/ServiceDetailSheet";
import { ownerFonts, ownerStyles } from "@/constants/ownerTheme";
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
  commissionLabel,
} from "@/lib/commissionLabel";
import { formatCurrency } from "@/lib/format";
import {
  buildStaffReferralLink,
  useStaffReferralLink,
} from "@/lib/referralLink";
import type { StaffService } from "@/services/staff/services";

const ALL_CATEGORY = "__all__";
const OTHER_CATEGORY = "__other__";

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

function OfferCard({
  service,
  busy,
  onAccept,
  onDecline,
  styles,
  colors,
}: {
  service: StaffService;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
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

  return (
    <View style={styles.offerCard}>
      <View style={styles.offerTop}>
        <ServiceThumb uri={service.image_url} styles={styles} colors={colors} />
        <View style={styles.offerBody}>
          <Text style={styles.svcName} numberOfLines={1}>
            {service.name}
          </Text>
          <Text style={styles.svcMeta} numberOfLines={1}>
            {service.duration_minutes} min · {formatCurrency(price, currency)}
            {" · "}
            {commissionLabel(type, value, currency)}
          </Text>
        </View>
      </View>
      <View style={styles.offerActions}>
        <Pressable
          style={[styles.declineBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={onDecline}>
          <Ionicons name="close" size={16} color={colors.danger} />
        </Pressable>
        <Pressable
          style={[styles.acceptBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={onAccept}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function ServiceRow({
  service,
  onPress,
  styles,
  colors,
}: {
  service: StaffService;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <Pressable style={styles.svcCard} onPress={onPress}>
      <ServiceThumb uri={service.image_url} styles={styles} colors={colors} />
      <View style={styles.svcBody}>
        <Text style={styles.svcName} numberOfLines={1}>
          {service.name}
        </Text>
        {service.description ? (
          <Text style={styles.svcDesc} numberOfLines={1}>
            {service.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
    </Pressable>
  );
}

export default function StaffServicesScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tenant } = useTenantContext();
  const { data: self } = useStaffSelf();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useStaffServices();
  const respond = useRespondToServiceOffer();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [selected, setSelected] = useState<StaffService | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const selectedLink = useStaffReferralLink(selected?.id);

  const services = data ?? [];
  const pending = useMemo(
    () => services.filter((s) => s.assignment_status === "pending"),
    [services],
  );
  const accepted = useMemo(
    () => services.filter((s) => s.assignment_status === "accepted"),
    [services],
  );

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(accepted.map((s) => s.category_name ?? OTHER_CATEGORY)),
    ).sort();
    return [ALL_CATEGORY, ...cats];
  }, [accepted]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accepted.filter((s) => {
      const svcCat = s.category_name ?? OTHER_CATEGORY;
      const matchCat = category === ALL_CATEGORY || svcCat === category;
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [accepted, category, search]);

  const avgCommission = useMemo(() => {
    const earnings = accepted
      .map((svc) => {
        const type =
          svc.offered_commission_type ?? svc.staff_commission_type ?? null;
        const value =
          svc.offered_commission_value ?? svc.staff_commission_value ?? null;
        return commissionEarnings(type, value, svc.effective_price ?? svc.price);
      })
      .filter((v): v is number => v !== null);
    return earnings.length > 0
      ? earnings.reduce((s, v) => s + v, 0) / earnings.length
      : 0;
  }, [accepted]);

  const avgDuration = useMemo(() => {
    if (accepted.length === 0) return 0;
    return Math.round(
      accepted.reduce((s, svc) => s + svc.duration_minutes, 0) / accepted.length,
    );
  }, [accepted]);

  const currency = accepted[0]?.currency_code || "EUR";

  function categoryLabel(cat: string): string {
    if (cat === ALL_CATEGORY) return t("staffServices.all");
    if (cat === OTHER_CATEGORY) return t("staffServices.other");
    return cat;
  }

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

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={t("staffServices.title")}
        subtitle={
          self
            ? `${accepted.length} ${t("staffServices.acceptedCount").toLowerCase()}`
            : undefined
        }
        displayTitle
      />
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
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{accepted.length}</Text>
            <Text style={styles.statLabel}>{t("staffServices.acceptedCount")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {accepted.length > 0 ? formatCurrency(avgCommission, currency) : "—"}
            </Text>
            <Text style={styles.statLabel}>{t("staffToday.commission")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {accepted.length > 0 ? `${avgDuration} min` : "—"}
            </Text>
            <Text style={styles.statLabel}>{t("staffServices.avgDuration")}</Text>
          </View>
        </View>

        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          empty={!isLoading && services.length === 0}
          emptyMessage={t("staffServices.empty")}
          onRetry={() => void refetch()}>
          {pending.length > 0 ? (
            <View style={styles.offersSection}>
              <Text style={styles.offersTitle}>
                {t("staffServices.offersTitle")} ({pending.length})
              </Text>
              {pending.map((svc) => (
                <OfferCard
                  key={svc.id}
                  service={svc}
                  busy={respondingId === svc.id || respond.isPending}
                  onAccept={() => handleRespond(svc, "accepted")}
                  onDecline={() => handleRespond(svc, "declined")}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          ) : null}

          <Text style={ownerStyles.sectionTitle}>{t("staffToday.myServices")}</Text>
          <TextInput
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            placeholder={t("staffServices.searchPh")}
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
          />
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            {categories.map((cat) => {
              const active = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(cat)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {categoryLabel(cat)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filtered.length === 0 ? (
            <Text style={styles.emptyFiltered}>{t("staffClientsPage.empty")}</Text>
          ) : (
            filtered.map((svc) => (
              <ServiceRow
                key={svc.id}
                service={svc}
                onPress={() => setSelected(svc)}
                styles={styles}
                colors={colors}
              />
            ))
          )}
        </QueryState>
      </ScrollView>

      <ServiceDetailSheet
        service={selected}
        visible={!!selected}
        referralLink={selectedLink}
        onClose={() => setSelected(null)}
        onShare={async () => {
          await shareFor(selected?.id);
        }}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    statCard: {
      flex: 1,
      backgroundColor: colors.primarySurface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
    },
    statValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.medium,
    },
    offersSection: {
      borderWidth: 1,
      borderColor: colors.warning,
      backgroundColor: colors.warningMuted,
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
    },
    offersTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.warning,
      marginBottom: 10,
      fontFamily: ownerFonts.bold,
    },
    offerCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.warning,
      padding: 12,
      marginBottom: 8,
      gap: 10,
    },
    offerTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    offerBody: { flex: 1, minWidth: 0 },
    offerActions: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "flex-end",
    },
    acceptBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: "#059669",
      alignItems: "center",
      justifyContent: "center",
    },
    acceptText: {
      color: "#fff",
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    declineBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.dangerMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    declineText: {
      color: colors.danger,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    search: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.card,
      marginBottom: 10,
      fontFamily: ownerFonts.regular,
    },
    chips: { gap: 8, paddingBottom: 12 },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.card,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    chipTextActive: {
      color: "#fff",
      fontWeight: "600",
    },
    svcCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 8,
    },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.primarySurface,
    },
    thumbFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    svcBody: { flex: 1, minWidth: 0 },
    svcName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    svcDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
      fontFamily: ownerFonts.regular,
    },
    svcMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    commHint: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 4,
      fontFamily: ownerFonts.medium,
    },
    emptyFiltered: {
      fontSize: 13,
      color: colors.textDim,
      textAlign: "center",
      marginTop: 16,
      fontFamily: ownerFonts.regular,
    },
    disabled: { opacity: 0.6 },
  });
}
