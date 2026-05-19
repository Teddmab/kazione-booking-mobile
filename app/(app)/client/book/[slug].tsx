import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

import BookingFlow from "@/components/booking/BookingFlow";

export default function BookBySlugScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  if (!slug) {
    return (
      <View style={styles.box}>
        <Text style={styles.err}>Missing salon.</Text>
      </View>
    );
  }

  return <BookingFlow slug={slug} />;
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: "center", alignItems: "center" },
  err: { color: "#b00020" },
});
