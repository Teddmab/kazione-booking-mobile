import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { LanguageFlagPicker } from "@/components/owner/LanguageFlagPicker";
import { QueryState } from "@/components/owner/QueryState";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerBusiness } from "@/hooks/useOwnerBusiness";
import { useUpdateUserProfile, useUserProfile } from "@/hooks/useUserProfile";

export default function OwnerSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuthContext();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const profileQuery = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const businessQuery = useOwnerBusiness(businessId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const p = profileQuery.data;
    if (p) {
      setFirstName(p.first_name ?? "");
      setLastName(p.last_name ?? "");
      setPhone(p.phone ?? "");
    }
  }, [profileQuery.data]);

  const saveProfile = () => {
    updateProfile.mutate({
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      phone: phone.trim() || null,
    });
  };

  const confirmSignOut = () => {
    Alert.alert(t("owner.signOutTitle"), t("owner.signOutConfirm"), [
      { text: t("owner.cancel"), style: "cancel" },
      {
        text: t("owner.signOut"),
        style: "destructive",
        onPress: () => {
          void signOut().then(() => router.replace("/(auth)/welcome"));
        },
      },
    ]);
  };

  const refreshing = profileQuery.isRefetching || businessQuery.isRefetching;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void profileQuery.refetch();
            void businessQuery.refetch();
          }}
        />
      }>
      <QueryState
        loading={profileQuery.isLoading || businessQuery.isLoading}
        error={profileQuery.isError ? (profileQuery.error as Error) : null}
        onRetry={() => void profileQuery.refetch()}>
        <Text style={styles.section}>{t("owner.settingsProfile")}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t("owner.displayName")}</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t("owner.firstName")}
            />
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t("owner.lastName")}
            />
          </View>
          <Text style={[styles.label, styles.spaced]}>{t("owner.emailReadonly")}</Text>
          <Text style={styles.value}>{user?.email ?? profileQuery.data?.email ?? "—"}</Text>
          <Text style={[styles.label, styles.spaced]}>{t("owner.phone")}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+372 ..."
          />
          <Pressable
            style={[ownerStyles.primaryBtn, styles.saveBtn, updateProfile.isPending && styles.disabled]}
            disabled={updateProfile.isPending}
            onPress={saveProfile}>
            <Text style={ownerStyles.primaryBtnText}>{t("owner.saveProfile")}</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>{t("owner.settingsBusiness")}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t("owner.businessName")}</Text>
          <Text style={styles.value}>{businessQuery.data?.name ?? tenant?.businessName ?? "—"}</Text>
          {businessQuery.data?.country ? (
            <>
              <Text style={[styles.label, styles.spaced]}>{t("owner.country")}</Text>
              <Text style={styles.value}>{businessQuery.data.country}</Text>
            </>
          ) : null}
          <Text style={styles.hint}>{t("owner.businessEditHint")}</Text>
        </View>

        <Text style={styles.section}>{t("owner.settingsPreferences")}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t("owner.selectLanguage")}</Text>
          <View style={styles.langRow}>
            <LanguageFlagPicker />
          </View>
        </View>

        <Text style={styles.section}>{t("owner.settingsAccount")}</Text>
        <Pressable style={ownerStyles.outlineBtn} onPress={confirmSignOut}>
          <Text style={ownerStyles.outlineBtnText}>{t("owner.signOut")}</Text>
        </Pressable>
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  section: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontSize: 12, color: ownerColors.textDim },
  spaced: { marginTop: 14 },
  value: { fontSize: 16, color: ownerColors.text, marginTop: 4, fontWeight: "500" },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
  },
  nameRow: { flexDirection: "row", gap: 8 },
  nameInput: { flex: 1 },
  saveBtn: { marginTop: 16 },
  disabled: { opacity: 0.7 },
  hint: { fontSize: 13, color: ownerColors.textMuted, lineHeight: 20, marginTop: 12 },
  langRow: { marginTop: 10, alignSelf: "flex-start" },
});
