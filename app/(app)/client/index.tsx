import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";

import { SafeImage } from "@/components/SafeImage";
import { useMarketplaceStorefronts } from "@/hooks/useMarketplace";
import type { StorefrontSummary } from "@/types/marketplace";

function SalonCard({ item, onPress }: { item: StorefrontSummary; onPress: () => void }) {
  const cover = item.cover_image_url;
  const subtitle = item.tagline ?? item.marketplace_headline ?? item.city ?? "";

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, salon`}
    >
      <SafeImage
        uri={cover}
        style={styles.cover}
        fallbackLetter={item.title}
        accessibilityLabel={`${item.title} cover`}
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {subtitle ? (
          <Text style={styles.cardSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {item.city ? <Text style={styles.meta}>{item.city}</Text> : null}
          {item.review_count > 0 ? (
            <Text style={styles.meta}>
              ★ {item.avg_rating.toFixed(1)} ({item.review_count})
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function ClientDiscoverScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useMarketplaceStorefronts(50);

  const featured = (data?.storefronts ?? []).slice(0, 6);

  const header = (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>Kazione</Text>
        <Text style={styles.heroTitle}>Find your next appointment</Text>
        <Text style={styles.heroBody}>Same salons as on the web — book from your phone.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.push("/(app)/client/browse")}>
          <Text style={styles.primaryBtnText}>Browse all salons</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionTitle}>Featured</Text>
    </>
  );

  const footer = (
    <View style={styles.footerLinks}>
      <Pressable onPress={() => router.push("/(app)/client/bookings")}>
        <Text style={styles.link}>My bookings</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/(app)/client/profile")}>
        <Text style={styles.link}>Profile</Text>
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading salons…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not load salons</Text>
        <Text style={styles.muted}>{error instanceof Error ? error.message : "Unknown error"}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => void refetch()}>
          <Text style={styles.primaryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.listContent}
      data={featured}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ListEmptyComponent={<Text style={styles.muted}>No salons published yet.</Text>}
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
      renderItem={({ item }) => (
        <SalonCard
          item={item}
          onPress={() => router.push(`/(app)/client/salon/${item.slug}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#faf8f5" },
  listContent: { padding: 20, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
  hero: { marginBottom: 20 },
  heroKicker: { fontSize: 12, letterSpacing: 2, color: "#8b7355", fontWeight: "600" },
  heroTitle: { fontSize: 26, fontWeight: "700", color: "#1a1a1a", marginTop: 6 },
  heroBody: { fontSize: 15, color: "#555", marginTop: 8, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#1a1a1a" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8e0d8",
  },
  cover: { width: 100, height: 100 },
  cardBody: { flex: 1, padding: 12, justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  cardSub: { fontSize: 13, color: "#666", marginTop: 4 },
  metaRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  meta: { fontSize: 12, color: "#888" },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#6b5344",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  muted: { color: "#777", textAlign: "center" },
  errorTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 24,
  },
  link: { color: "#6b5344", fontWeight: "600", fontSize: 15 },
});
