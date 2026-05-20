import { Pressable, Text, View, StyleSheet } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";

export function OwnerBusinessHeader() {
  const { tenant, businesses, setActiveBusiness } = useTenantContext();

  if (!tenant) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.name} numberOfLines={1}>
        {tenant.businessName}
      </Text>
      <Text style={styles.role}>
        {tenant.role === "manager" ? "Gérant" : "Propriétaire"}
      </Text>
      {businesses.length > 1 ? (
        <View style={styles.switcher}>
          {businesses.map((b) => (
            <Pressable
              key={b.businessId}
              style={[
                styles.chip,
                b.businessId === tenant.businessId && styles.chipActive,
              ]}
              onPress={() => void setActiveBusiness(b.businessId)}>
              <Text
                style={[
                  styles.chipText,
                  b.businessId === tenant.businessId && styles.chipTextActive,
                ]}
                numberOfLines={1}>
                {b.businessName}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: ownerColors.bg,
    borderBottomWidth: 1,
    borderBottomColor: ownerColors.border,
  },
  name: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  role: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  switcher: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    maxWidth: "48%",
  },
  chipActive: {
    backgroundColor: ownerColors.primaryMuted,
    borderColor: ownerColors.primary,
  },
  chipText: { fontSize: 12, color: ownerColors.textMuted },
  chipTextActive: { color: ownerColors.primary, fontWeight: "600" },
});
