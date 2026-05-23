import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeImage } from "@/components/SafeImage";
import { PromotionFormSheet } from "@/components/owner/PromotionFormSheet";
import { QueryState } from "@/components/owner/QueryState";
import { StorefrontGalleryGrid } from "@/components/owner/StorefrontGalleryGrid";
import { SwitchRow } from "@/components/owner/SwitchRow";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  useAddPromotion,
  useDeleteGalleryImage,
  useGalleryImages,
  useOwnerStorefront,
  usePublishStorefront,
  useRemovePromotion,
  useStorefrontPromotions,
  useUpdateStorefront,
  useUploadCoverImage,
  useUploadGalleryImage,
} from "@/hooks/useOwnerStorefront";
import { pickImage } from "@/lib/imageUpload";
import type { GalleryItem, StorefrontRow } from "@/types/owner";

function EditorForm({
  data,
  businessId,
  onRefresh,
}: {
  data: StorefrontRow;
  businessId: string;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const [tagline, setTagline] = useState(data.tagline ?? "");
  const [about, setAbout] = useState(data.extended_description ?? data.description ?? "");
  const [marketplaceListed, setMarketplaceListed] = useState(
    data.is_published || data.marketplace_status === "active",
  );
  const [featured, setFeatured] = useState(data.marketplace_featured ?? false);
  const [promoOpen, setPromoOpen] = useState(false);

  const update = useUpdateStorefront(businessId);
  const uploadCover = useUploadCoverImage(businessId);
  const gallery = useGalleryImages(businessId);
  const promotions = useStorefrontPromotions(businessId);
  const uploadGallery = useUploadGalleryImage(businessId);
  const deleteGallery = useDeleteGalleryImage(businessId);
  const addPromo = useAddPromotion(businessId);
  const removePromo = useRemovePromotion(businessId);
  const publish = usePublishStorefront(businessId);

  useEffect(() => {
    setTagline(data.tagline ?? "");
    setAbout(data.extended_description ?? data.description ?? "");
    setMarketplaceListed(data.is_published || data.marketplace_status === "active");
    setFeatured(data.marketplace_featured ?? false);
  }, [data]);

  const draftPatch = useMemo(
    () => ({
      tagline: tagline.trim() || null,
      extended_description: about.trim() || null,
      description: about.trim() || null,
      marketplace_featured: featured,
    }),
    [tagline, about, featured],
  );

  const saveAll = () => {
    update.saveNow(draftPatch);
    if (marketplaceListed !== data.is_published) {
      publish.mutate(marketplaceListed);
    }
  };

  const changeCover = async () => {
    try {
      const assets = await pickImage();
      const uri = assets?.[0]?.uri;
      if (!uri) return;
      await uploadCover.mutateAsync(uri);
    } catch (err) {
      Alert.alert(t("owner.uploadFailed"), err instanceof Error ? err.message : "");
    }
  };

  const addGalleryUris = async (uris: string[]) => {
    for (const uri of uris) {
      await uploadGallery.mutateAsync({ storefrontId: data.id, uri });
    }
  };

  const removeGallery = (item: GalleryItem) => {
    deleteGallery.mutate({ galleryId: item.id, imageUrl: item.image_url });
  };

  const removePromotionRow = (id: string) => {
    Alert.alert(t("owner.promoRemoveTitle"), t("owner.promoRemoveMsg"), [
      { text: t("owner.cancel"), style: "cancel" },
      {
        text: t("owner.remove"),
        style: "destructive",
        onPress: () => removePromo.mutate(id),
      },
    ]);
  };

  const saving = update.isPending || publish.isPending;

  return (
    <>
      <Text style={styles.section}>{t("owner.storefrontBranding")}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>{t("owner.businessName")}</Text>
        <Text style={styles.readonly}>{data.title}</Text>
        <Text style={[styles.label, styles.spaced]}>{t("owner.storefrontTagline")}</Text>
        <TextInput
          style={styles.input}
          value={tagline}
          onChangeText={(v) => {
            setTagline(v);
            update.debouncedSave({ tagline: v.trim() || null });
          }}
          maxLength={140}
          placeholder={t("owner.storefrontTaglinePlaceholder")}
        />
        <Text style={[styles.label, styles.spaced]}>{t("owner.storefrontAbout")}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={about}
          onChangeText={(v) => {
            setAbout(v);
            update.debouncedSave({
              extended_description: v.trim() || null,
              description: v.trim() || null,
            });
          }}
          maxLength={800}
          multiline
          placeholder={t("owner.storefrontAboutPlaceholder")}
        />
      </View>

      <Text style={styles.section}>{t("owner.storefrontCover")}</Text>
      <View style={styles.card}>
        <SafeImage uri={data.cover_image_url} style={styles.cover} fallbackLetter={data.title} />
        <Pressable style={styles.secondaryBtn} onPress={() => void changeCover()} disabled={uploadCover.isPending}>
          {uploadCover.isPending ? (
            <ActivityIndicator color={ownerColors.primary} />
          ) : (
            <Text style={styles.secondaryBtnText}>{t("owner.changeCover")}</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.section}>{t("owner.storefrontVisibility")}</Text>
      <View style={styles.card}>
        <SwitchRow
          label={t("owner.marketplaceListed")}
          subtitle={t("owner.marketplaceListedHint")}
          value={marketplaceListed}
          onValueChange={setMarketplaceListed}
        />
        <SwitchRow
          label={t("owner.marketplaceFeatured")}
          subtitle={t("owner.marketplaceFeaturedHint")}
          value={featured}
          onValueChange={(v) => {
            setFeatured(v);
            update.debouncedSave({ marketplace_featured: v });
          }}
        />
      </View>

      <Text style={styles.section}>{t("owner.storefrontPromotions")}</Text>
      <View style={styles.card}>
        {(promotions.data ?? []).length === 0 ? (
          <Text style={styles.muted}>{t("owner.promoEmpty")}</Text>
        ) : (
          (promotions.data ?? []).map((p) => (
            <Pressable key={p.id} style={styles.promoRow} onLongPress={() => removePromotionRow(p.id)}>
              <Text style={styles.promoTitle}>{p.title}</Text>
              {p.description ? <Text style={styles.muted}>{p.description}</Text> : null}
              {p.valid_until ? (
                <Text style={styles.promoDate}>{t("owner.promoUntil", { date: p.valid_until })}</Text>
              ) : null}
            </Pressable>
          ))
        )}
        <Pressable style={styles.secondaryBtn} onPress={() => setPromoOpen(true)}>
          <Text style={styles.secondaryBtnText}>{t("owner.promoAdd")}</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>{t("owner.storefrontGallery")}</Text>
      <View style={styles.card}>
        <StorefrontGalleryGrid
          images={gallery.data ?? []}
          uploading={uploadGallery.isPending}
          onAdd={(uris) => void addGalleryUris(uris)}
          onRemove={removeGallery}
        />
      </View>

      <Pressable
        style={[ownerStyles.primaryBtn, styles.saveBtn, saving && styles.disabled]}
        disabled={saving}
        onPress={saveAll}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
        )}
      </Pressable>

      <PromotionFormSheet
        visible={promoOpen}
        onClose={() => setPromoOpen(false)}
        loading={addPromo.isPending}
        onSubmit={(payload) => {
          addPromo.mutate(payload, { onSuccess: () => setPromoOpen(false) });
        }}
      />
    </>
  );
}

export default function OwnerStorefrontScreen() {
  const { t } = useTranslation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const query = useOwnerStorefront(businessId);

  const refresh = () => {
    void query.refetch();
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={refresh} />}>
      <QueryState
        loading={query.isLoading}
        error={query.isError ? (query.error as Error) : null}
        empty={!query.isLoading && !query.data}
        emptyMessage={t("owner.storefrontEmpty")}
        onRetry={refresh}>
        {query.data ? (
          <EditorForm data={query.data} businessId={businessId} onRefresh={refresh} />
        ) : null}
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  section: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 12,
  },
  label: { fontSize: 12, color: ownerColors.textDim, marginBottom: 6 },
  spaced: { marginTop: 12 },
  readonly: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  cover: { width: "100%", height: 160, borderRadius: 10, marginBottom: 12 },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
  muted: { fontSize: 14, color: ownerColors.textMuted, lineHeight: 20 },
  promoRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ownerColors.border },
  promoTitle: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  promoDate: { fontSize: 12, color: ownerColors.textDim, marginTop: 4 },
  saveBtn: { marginTop: 8 },
  disabled: { opacity: 0.7 },
});
