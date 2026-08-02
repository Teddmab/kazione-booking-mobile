import { useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { WorkingHoursCard } from "@/components/staff/WorkingHoursCard";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useLanguage } from "@/hooks/useLanguage";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { roleLabel } from "@/lib/workspaceRouting";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "et", label: "Eesti", flag: "🇪🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
] as const;

export default function StaffProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuthContext();
  const { tenant, clearActiveBusiness } = useTenantContext();
  const { data: staff, isLoading } = useStaffSelf();
  const { language, setLanguage } = useLanguage();

  function handleLogout() {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: () => {
          void signOut().then(() => router.replace("/(auth)/login" as Href));
        },
      },
    ]);
  }

  async function switchWorkspace() {
    await clearActiveBusiness();
    router.replace("/(auth)/role-select" as Href);
  }

  const initials = staff
    ? `${staff.first_name?.[0] ?? ""}${staff.last_name?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar title="Profil" subtitle={tenant?.businessName} displayTitle />
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={ownerColors.primary} />
        ) : (
          <>
            <View style={styles.avatarSection}>
              {staff?.avatar_url ? (
                <Image source={{ uri: staff.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <Text style={styles.name}>
                {staff ? `${staff.first_name} ${staff.last_name}`.trim() : "…"}
              </Text>
              <Text style={styles.role}>
                {roleLabel(
                  (staff?.role as "staff") ?? "staff",
                  staff?.position ?? tenant?.position,
                )}
              </Text>
            </View>

            <View style={styles.infoCard}>
              {staff?.email ? (
                <Text style={styles.info}>✉  {staff.email}</Text>
              ) : null}
              {staff?.phone ? (
                <Text style={styles.info}>📞  {staff.phone}</Text>
              ) : null}
              {tenant?.businessName ? (
                <Text style={styles.info}>🏪  {tenant.businessName}</Text>
              ) : null}
            </View>

            <WorkingHoursCard workingHours={staff?.working_hours ?? []} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Langue</Text>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  style={[
                    styles.langRow,
                    language === lang.code && styles.langRowActive,
                  ]}>
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={styles.langLabel}>{lang.label}</Text>
                  {language === lang.code ? (
                    <Text style={styles.check}>✓</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.switchBtn} onPress={() => void switchWorkspace()}>
              <Text style={styles.switchText}>{"Changer d'espace"}</Text>
            </Pressable>

            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Déconnexion</Text>
            </Pressable>

            <Text style={styles.webHint}>
              Pour modifier vos horaires ou votre photo, connectez-vous au dashboard web.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, paddingBottom: 40 },
  avatarSection: { alignItems: "center", paddingVertical: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarFallback: {
    backgroundColor: ownerColors.avatar,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    fontFamily: ownerFonts.bold,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  role: {
    fontSize: 14,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  infoCard: {
    ...ownerStyles.card,
    gap: 6,
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: ownerColors.text,
    fontFamily: ownerFonts.regular,
  },
  section: {
    ...ownerStyles.card,
    backgroundColor: ownerColors.primarySurface,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ownerColors.text,
    marginBottom: 8,
    fontFamily: ownerFonts.bold,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  langRowActive: { backgroundColor: ownerColors.primaryMuted },
  langFlag: { fontSize: 20 },
  langLabel: {
    flex: 1,
    fontSize: 14,
    color: ownerColors.text,
    fontFamily: ownerFonts.medium,
  },
  check: {
    fontSize: 16,
    color: ownerColors.primary,
    fontWeight: "700",
  },
  switchBtn: {
    ...ownerStyles.outlineBtn,
    marginTop: 4,
  },
  switchText: ownerStyles.outlineBtnText,
  logoutBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.danger,
    marginTop: 8,
    backgroundColor: ownerColors.dangerMuted,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: ownerColors.danger,
    fontFamily: ownerFonts.semiBold,
  },
  webHint: {
    fontSize: 12,
    color: ownerColors.textDim,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
    fontFamily: ownerFonts.regular,
  },
});
