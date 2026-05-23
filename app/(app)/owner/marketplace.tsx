import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeImage } from "@/components/SafeImage";
import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { QueryState } from "@/components/owner/QueryState";
import { SwitchRow } from "@/components/owner/SwitchRow";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  useOwnerStorefront,
  usePublishStorefront,
  useUpdateStorefront,
} from "@/hooks/useOwnerStorefront";

type Tab = "overview" | "visibility" | "listing" | "preview";

export default function OwnerMarketplaceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [tab, setTab] = useState<Tab>("overview");
  const [listed, setListed] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [tagline, setTagline] = useState("");

  const query = useOwnerStorefront(businessId);
  const update = useUpdateStorefront(businessId);
  const publish = usePublishStorefront(businessId);
  const data = query.data;

  useEffect(() => {
    if (!data) return;
    setListed(data.is_published || data.marketplace_status === "active");
    setFeatured(data.marketplace_featured ?? false);
    setTagline(data.tagline ?? "");
  }, [data]);

  const statusLabel = listed
    ? t("owner.marketplaceStatusListed")
    : data?.marketplace_status === "draft"
      ? t("owner.marketplaceStatusDraft")
      : t("owner.marketplaceStatusPaused");

  const tabs = useMemo(
    () => [
      { key: "overview" as const, label: t("owner.marketplaceTabOverview") },
      { key: "visibility" as const, label: t("owner.marketplaceTabVisibility") },
      { key: "listing" as const, label: t("owner.marketplaceTabListing") },
      { key: "preview" as const, label: t("owner.marketplaceTabPreview") },
    ],
    [t],
  );

  const save = () => {
    update.saveNow({ tagline: tagline.trim() || null, marketplace_featured: featured });
    if (listed !== (data?.is_published ?? false)) {
      publish.mutate(listed);
    }
  };

  const openPreview = () => {
    if (data?.slug) {
      router.push(`/(app)/client/salon/${data.slug}` as Href);
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
      <View style={styles.statusRow}>
        <View style={[styles.statusPill, listed ? styles.statusLive : styles.statusPaused]}>
          <Text style={styles.statusPillText}>{statusLabel}</Text>
        </View>
        <Pressable style={styles.linkBtn} onPress={openPreview}>
          <Text style={styles.linkText}>{t("owner.marketplaceViewPublic")}</Text>
        </Pressable>
      </View>

      <TabChipSelector value={tab} chips={tabs} onChange={setTab} />

      <QueryState
        loading={query.isLoading}
        error={query.isError ? (query.error as Error) : null}
        onRetry={() => void query.refetch()}>
        {tab === "overview" && data ? (
          <View style={styles.grid}>
            <DashboardStatCard label={t("owner.marketplaceStatus")} value={statusLabel} icon="globe-outline" />
            <DashboardStatCard
              label={t("owner.marketplaceFeatured")}
              value={featured ? t("owner.yes") : t("owner.no")}
              icon="star-outline"
            />
            <DashboardStatCard label={t("owner.businessName")} value={data.title} icon="storefront-outline" />
            <DashboardStatCard label={t("owner.storefrontGallery")} value={data.city ?? "—"} icon="location-outline" />
          </View>
        ) : null}

        {tab === "visibility" ? (
          <View style={styles.card}>
            <SwitchRow
              label={t("owner.marketplaceListed")}
              subtitle={t("owner.marketplaceListedHint")}
              value={listed}
              onValueChange={setListed}
            />
            <SwitchRow
              label={t("owner.marketplaceFeatured")}
              subtitle={t("owner.marketplaceFeaturedHint")}
              value={featured}
              onValueChange={setFeatured}
            />
          </View>
        ) : null}

        {tab === "listing" && data ? (
          <View style={styles.card}>
            <Text style={styles.label}>{t("owner.storefrontTagline")}</Text>
            <TextInput
              style={styles.input}
              value={tagline}
              onChangeText={setTagline}
              maxLength={140}
              placeholder={t("owner.storefrontTaglinePlaceholder")}
            />
            <SafeImage uri={data.cover_image_url} style={styles.cover} fallbackLetter={data.title} />
            <Text style={styles.previewTitle}>{data.title}</Text>
            {tagline ? <Text style={styles.previewTagline}>{tagline}</Text> : null}
          </View>
        ) : null}

        {tab === "preview" && data ? (
          <Pressable style={styles.previewCard} onPress={openPreview}>
            <SafeImage uri={data.cover_image_url} style={styles.previewCover} fallbackLetter={data.title} />
            <Text style={styles.previewTitle}>{data.title}</Text>
            <Text style={styles.previewTagline}>{tagline || data.tagline || t("owner.marketplaceNoTagline")}</Text>
            <Text style={styles.previewHint}>{t("owner.marketplaceTapPreview")}</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[ownerStyles.primaryBtn, styles.saveBtn, (update.isPending || publish.isPending) && styles.disabled]}
          disabled={update.isPending || publish.isPending}
          onPress={save}>
          <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
        </Pressable>
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusLive: { backgroundColor: ownerColors.successMuted },
  statusPaused: { backgroundColor: ownerColors.warningMuted },
  statusPillText: { fontSize: 12, fontWeight: "700", color: ownerColors.text },
  linkBtn: { paddingVertical: 6 },
  linkText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginTop: 12,
  },
  label: { fontSize: 12, color: ownerColors.textDim, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
    marginBottom: 12,
  },
  cover: { width: "100%", height: 140, borderRadius: 10, marginBottom: 10 },
  previewCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginTop: 12,
  },
  previewCover: { width: "100%", height: 160, borderRadius: 10, marginBottom: 10 },
  previewTitle: { fontSize: 18, fontWeight: "700", color: ownerColors.text },
  previewTagline: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4 },
  previewHint: { fontSize: 12, color: ownerColors.primary, marginTop: 10 },
  saveBtn: { marginTop: 20 },
  disabled: { opacity: 0.7 },
});
