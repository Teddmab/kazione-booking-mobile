import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { SafeImage } from "@/components/SafeImage";
import { useStorefrontDetail } from "@/hooks/useMarketplace";

export default function SalonDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useStorefrontDetail(slug);

  if (isLoading || !slug) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>Salon not found</Text>
        <Text style={styles.errMsg}>{error instanceof Error ? error.message : ""}</Text>
        <Pressable style={styles.btn} onPress={() => void refetch()}>
          <Text style={styles.btnTxt}>Retry</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const currency = data.currencyCode === "EUR" ? "€" : data.currencyCode === "USD" ? "$" : "";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <SafeImage
        uri={data.coverImageUrl}
        style={styles.cover}
        fallbackLetter={data.name}
        accessibilityLabel={`${data.name} cover`}
      />

      <View style={styles.headerRow}>
        <SafeImage
          uri={data.logoUrl}
          style={styles.logo}
          fallbackLetter={data.name}
          accessibilityLabel={`${data.name} logo`}
        />
        <View style={styles.headerText}>
          <Text style={styles.name}>{data.name}</Text>
          {data.tagline ? <Text style={styles.tagline}>{data.tagline}</Text> : null}
          {data.reviewCount > 0 ? (
            <Text style={styles.rating}>
              ★ {data.rating.toFixed(1)} ({data.reviewCount} reviews)
            </Text>
          ) : null}
        </View>
      </View>

      {data.description ? <Text style={styles.desc}>{data.description}</Text> : null}

      <Text style={styles.section}>Services</Text>
      {data.services.length === 0 ? (
        <Text style={styles.muted}>No services listed.</Text>
      ) : (
        data.services.map((svc) => (
          <View key={svc.id} style={styles.serviceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.svcName}>{svc.name}</Text>
              <Text style={styles.svcMeta}>
                {svc.category} · {svc.duration}
              </Text>
            </View>
            <Text style={styles.price}>
              {currency}
              {svc.price.toFixed(2)}
            </Text>
          </View>
        ))
      )}

      <Pressable
        style={styles.bookBtn}
        onPress={() => router.push(`/(app)/client/book/${data.slug}`)}
      >
        <Text style={styles.bookBtnText}>Book (coming soon)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fff" },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
  cover: { width: "100%", height: 180 },
  headerRow: { flexDirection: "row", padding: 16, gap: 14, alignItems: "flex-start" },
  logo: { width: 72, height: 72, borderRadius: 14, borderWidth: 1, borderColor: "#e8e0d8" },
  headerText: { flex: 1, paddingTop: 4 },
  name: { fontSize: 24, fontWeight: "700", color: "#111" },
  tagline: { fontSize: 15, color: "#666", marginTop: 4 },
  rating: { fontSize: 13, color: "#888", marginTop: 6 },
  desc: { fontSize: 15, lineHeight: 22, color: "#444", paddingHorizontal: 16, marginTop: 8 },
  section: { fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 12, paddingHorizontal: 16 },
  muted: { paddingHorizontal: 16, color: "#888" },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  svcName: { fontSize: 16, fontWeight: "600", color: "#111" },
  svcMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  price: { fontSize: 16, fontWeight: "700", color: "#6b5344" },
  bookBtn: {
    margin: 16,
    marginTop: 28,
    backgroundColor: "#6b5344",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  errTitle: { fontSize: 18, fontWeight: "600" },
  errMsg: { color: "#666", textAlign: "center" },
  btn: { backgroundColor: "#6b5344", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnTxt: { color: "#fff", fontWeight: "600" },
  link: { color: "#6b5344", marginTop: 8 },
});
