import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";

import { SafeImage } from "@/components/SafeImage";
import { QueryState } from "@/components/owner/QueryState";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerStorefront } from "@/hooks/useOwnerStorefront";

export default function OwnerStorefrontScreen() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useOwnerStorefront(businessId);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
      }>
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && !data}
        emptyMessage="Aucune vitrine configurée."
        onRetry={() => void refetch()}>
        {data ? (
          <>
            <SafeImage
              uri={data.cover_image_url}
              style={styles.cover}
              fallbackLetter={data.title}
            />
            <View style={styles.card}>
              <View style={styles.pubRow}>
                <Text style={styles.title}>{data.title}</Text>
                <View
                  style={[styles.pubBadge, data.is_published ? styles.pubOn : styles.pubOff]}>
                  <Text style={styles.pubText}>
                    {data.is_published ? "Publiée" : "Brouillon"}
                  </Text>
                </View>
              </View>
              {data.tagline ? <Text style={styles.tagline}>{data.tagline}</Text> : null}
              <Text style={styles.slug}>/{data.slug}</Text>
            </View>
            <Text style={styles.hint}>
              Édition complète (galerie, sections, publication) : utilisez la version web
              « Vitrine ».
            </Text>
          </>
        ) : null}
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { paddingBottom: 32 },
  cover: { width: "100%", height: 180, backgroundColor: ownerColors.border },
  card: {
    margin: 16,
    marginTop: -24,
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
  },
  pubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text, flex: 1 },
  tagline: { fontSize: 15, color: ownerColors.textMuted, marginTop: 8, lineHeight: 22 },
  slug: { fontSize: 13, color: ownerColors.textDim, marginTop: 10 },
  pubBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  pubOn: { backgroundColor: "#e8f5e9" },
  pubOff: { backgroundColor: "#f5f0eb" },
  pubText: { fontSize: 12, fontWeight: "600", color: ownerColors.textMuted },
  hint: {
    fontSize: 13,
    color: ownerColors.textMuted,
    marginHorizontal: 16,
    lineHeight: 20,
  },
});
