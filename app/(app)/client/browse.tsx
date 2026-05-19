import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { SafeImage } from "@/components/SafeImage";
import { useMarketplaceStorefronts } from "@/hooks/useMarketplace";
import type { StorefrontSummary } from "@/types/marketplace";

export default function BrowseSalonsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error, refetch, isRefetching } = useMarketplaceStorefronts(50);

  const filtered = useMemo(() => {
    const list = data?.storefronts ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.marketplace_tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (s.city ?? "").toLowerCase().includes(q),
    );
  }, [data?.storefronts, search]);

  const renderItem = ({ item }: { item: StorefrontSummary }) => {
    const cover = item.cover_image_url;
    return (
      <Pressable
        style={styles.row}
        onPress={() => router.push(`/(app)/client/salon/${item.slug}`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, salon`}
      >
        <SafeImage
          uri={cover}
          style={styles.thumb}
          fallbackLetter={item.title}
          accessibilityLabel={`${item.title} thumbnail`}
        />
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {item.city ?? "—"} · {item.tagline ?? item.marketplace_headline ?? "Salon"}
          </Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error instanceof Error ? error.message : "Error"}</Text>
        <Pressable style={styles.btn} onPress={() => void refetch()}>
          <Text style={styles.btnTxt}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.search}
        placeholder="Search by name, city, or tag"
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        ListEmptyComponent={
          <Text style={styles.empty}>No salons match your search.</Text>
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listPad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  search: {
    margin: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  listPad: { padding: 16, paddingTop: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  thumb: { width: 56, height: 56, borderRadius: 10, marginRight: 12 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  rowSub: { fontSize: 13, color: "#666", marginTop: 2 },
  chev: { fontSize: 22, color: "#bbb", paddingLeft: 8 },
  empty: { textAlign: "center", color: "#888", marginTop: 32 },
  err: { color: "#b00020", marginBottom: 12, textAlign: "center" },
  btn: { backgroundColor: "#6b5344", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnTxt: { color: "#fff", fontWeight: "600" },
});
