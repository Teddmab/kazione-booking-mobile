import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
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
import { SwitchRow } from "@/components/owner/SwitchRow";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useCreateBusiness } from "@/hooks/useCreateBusiness";
import {
  useBusinessStorefront,
  useStripeConnectStatus,
  useStripeOnboarding,
  useUpdateBusinessStorefront,
} from "@/hooks/useOwnerBusinessSettings";
import { useUpdateUserProfile, useUserProfile } from "@/hooks/useUserProfile";

type SettingsTab = "profile" | "business" | "notifications" | "payments" | "language";

export default function OwnerSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuthContext();
  const { tenant, businesses, setActiveBusiness } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [businessPickerOpen, setBusinessPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");

  const profileQuery = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const businessQuery = useBusinessStorefront(businessId);
  const updateBusiness = useUpdateBusinessStorefront(businessId);
  const stripeStatus = useStripeConnectStatus(businessId);
  const stripeOnboard = useStripeOnboarding(businessId);
  const createBusiness = useCreateBusiness();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [salonName, setSalonName] = useState("");
  const [city, setCity] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [notifyBooking, setNotifyBooking] = useState(true);
  const [notifyCancel, setNotifyCancel] = useState(true);

  useEffect(() => {
    const p = profileQuery.data;
    if (p) {
      setFirstName(p.first_name ?? "");
      setLastName(p.last_name ?? "");
      setPhone(p.phone ?? "");
    }
  }, [profileQuery.data]);

  useEffect(() => {
    const b = businessQuery.data;
    if (b) {
      setSalonName(b.title ?? "");
      setCity(b.city ?? "");
      setSalonPhone(b.phone ?? "");
    }
  }, [businessQuery.data]);

  const tabs = useMemo(
    () => [
      { key: "profile" as const, label: t("owner.settingsProfile") },
      { key: "business" as const, label: t("owner.settingsBusiness") },
      { key: "notifications" as const, label: t("owner.settingsNotifications") },
      { key: "payments" as const, label: t("owner.settingsPayments") },
      { key: "language" as const, label: t("owner.settingsPreferences") },
    ],
    [t],
  );

  const saveProfile = () => {
    updateProfile.mutate({
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      phone: phone.trim() || null,
    });
  };

  const saveBusiness = () => {
    updateBusiness.mutate({
      title: salonName.trim() || null,
      city: city.trim() || null,
      phone: salonPhone.trim() || null,
    });
  };

  const submitCreateBusiness = () => {
    const name = newBusinessName.trim();
    if (!name) return;
    createBusiness.mutate(
      { business_name: name },
      {
        onSuccess: (res) => {
          setCreateOpen(false);
          setNewBusinessName("");
          void setActiveBusiness(res.business_id);
        },
      },
    );
  };

  const openStripe = () => {
    const returnUrl = Linking.createURL("owner/settings");
    stripeOnboard.mutate(
      { returnUrl, refreshUrl: returnUrl },
      {
        onSuccess: (res) => {
          if ("onboarding_url" in res) void Linking.openURL(res.onboarding_url);
        },
      },
    );
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
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void profileQuery.refetch();
              void businessQuery.refetch();
              void stripeStatus.refetch();
            }}
          />
        }>
        <Pressable style={styles.businessPicker} onPress={() => setBusinessPickerOpen(true)}>
          <Text style={styles.businessPickerLabel}>{t("owner.currentBusiness")}</Text>
          <Text style={styles.businessPickerValue}>{tenant?.businessName ?? "—"}</Text>
        </Pressable>

        <TabChipSelector value={tab} chips={tabs} onChange={setTab} />

        <QueryState
          loading={profileQuery.isLoading || businessQuery.isLoading}
          error={profileQuery.isError ? (profileQuery.error as Error) : null}
          onRetry={() => void profileQuery.refetch()}>
          {tab === "profile" ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t("owner.displayName")}</Text>
              <View style={styles.nameRow}>
                <TextInput style={[styles.input, styles.nameInput]} value={firstName} onChangeText={setFirstName} placeholder={t("owner.firstName")} />
                <TextInput style={[styles.input, styles.nameInput]} value={lastName} onChangeText={setLastName} placeholder={t("owner.lastName")} />
              </View>
              <Text style={[styles.label, styles.spaced]}>{t("owner.emailReadonly")}</Text>
              <Text style={styles.value}>{user?.email ?? profileQuery.data?.email ?? "—"}</Text>
              <Text style={[styles.label, styles.spaced]}>{t("owner.phone")}</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+372 ..." />
              <Pressable style={[ownerStyles.primaryBtn, styles.saveBtn, updateProfile.isPending && styles.disabled]} disabled={updateProfile.isPending} onPress={saveProfile}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.saveProfile")}</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "business" ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t("owner.businessName")}</Text>
              <TextInput style={styles.input} value={salonName} onChangeText={setSalonName} />
              <Text style={[styles.label, styles.spaced]}>{t("owner.city")}</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />
              <Text style={[styles.label, styles.spaced]}>{t("owner.phone")}</Text>
              <TextInput style={styles.input} value={salonPhone} onChangeText={setSalonPhone} keyboardType="phone-pad" />
              <Pressable style={[ownerStyles.primaryBtn, styles.saveBtn, updateBusiness.isPending && styles.disabled]} disabled={updateBusiness.isPending} onPress={saveBusiness}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "notifications" ? (
            <View style={styles.card}>
              <SwitchRow label={t("owner.notifyBooking")} value={notifyBooking} onValueChange={setNotifyBooking} />
              <SwitchRow label={t("owner.notifyCancel")} value={notifyCancel} onValueChange={setNotifyCancel} />
              <Text style={styles.hint}>{t("owner.notifyHint")}</Text>
            </View>
          ) : null}

          {tab === "payments" ? (
            <View style={styles.card}>
              <Text style={styles.value}>
                {stripeStatus.data?.connected ? t("owner.stripeConnected") : t("owner.stripeNotConnected")}
              </Text>
              {!stripeStatus.data?.connected ? (
                <Pressable style={[ownerStyles.outlineBtn, styles.saveBtn]} onPress={openStripe}>
                  <Text style={ownerStyles.outlineBtnText}>{t("owner.stripeConnect")}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {tab === "language" ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t("owner.selectLanguage")}</Text>
              <View style={styles.langRow}>
                <LanguageFlagPicker />
              </View>
            </View>
          ) : null}

          <Pressable style={ownerStyles.outlineBtn} onPress={confirmSignOut}>
            <Text style={ownerStyles.outlineBtnText}>{t("owner.signOut")}</Text>
          </Pressable>
        </QueryState>
      </ScrollView>

      <Modal visible={businessPickerOpen} transparent animationType="slide" onRequestClose={() => setBusinessPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setBusinessPickerOpen(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{t("owner.myBusinesses")}</Text>
          {businesses.map((b) => (
            <Pressable
              key={b.businessId}
              style={styles.modalRow}
              onPress={() => {
                void setActiveBusiness(b.businessId);
                setBusinessPickerOpen(false);
              }}>
              <Text style={styles.modalRowText}>{b.businessName}</Text>
              {b.businessId === tenant?.businessId ? <Text style={styles.modalActive}>✓</Text> : null}
            </Pressable>
          ))}
          <Pressable style={styles.modalAdd} onPress={() => { setBusinessPickerOpen(false); setCreateOpen(true); }}>
            <Text style={styles.modalAddText}>+ {t("owner.addBusiness")}</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.createModal}>
          <Text style={styles.modalTitle}>{t("owner.addBusiness")}</Text>
          <TextInput style={styles.input} value={newBusinessName} onChangeText={setNewBusinessName} placeholder={t("owner.businessName")} />
          <Pressable style={ownerStyles.primaryBtn} onPress={submitCreateBusiness}>
            <Text style={ownerStyles.primaryBtnText}>{t("owner.createBusiness")}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  businessPicker: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 12,
  },
  businessPickerLabel: { fontSize: 12, color: ownerColors.textDim },
  businessPickerValue: { fontSize: 16, fontWeight: "600", color: ownerColors.text, marginTop: 4 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    marginTop: 12,
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
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 12 },
  modalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ownerColors.border },
  modalRowText: { fontSize: 16, color: ownerColors.text },
  modalActive: { color: ownerColors.primary, fontWeight: "700" },
  modalAdd: { marginTop: 16, paddingVertical: 12 },
  modalAddText: { fontSize: 15, fontWeight: "600", color: ownerColors.primary },
  createModal: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.5)" },
});
