import { useMemo, useState } from "react";
import { useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AddExceptionSheet } from "@/components/staff/AddExceptionSheet";
import { SelfScheduleEditor } from "@/components/staff/SelfScheduleEditor";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useDeleteSelfOverride,
  useSelfOverrides,
  useStaffSelf,
  useUpdateSelfProfile,
  useUpdateSelfSchedule,
  useUpsertSelfOverride,
} from "@/hooks/useStaffSelf";
import { roleLabel } from "@/lib/workspaceRouting";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "et", label: "Eesti", flag: "🇪🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
] as const;

function monthRange(base: Date): { from: string; to: string; label: string } {
  const y = base.getFullYear();
  const m = base.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(to.getDate())}`,
    label: from.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
  };
}

export default function StaffProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuthContext();
  const { tenant, clearActiveBusiness } = useTenantContext();
  const { data: staff, isLoading } = useStaffSelf();
  const { language, setLanguage } = useLanguage();
  const toast = useToast();

  const updateProfile = useUpdateSelfProfile();
  const updateSchedule = useUpdateSelfSchedule();
  const upsertOverride = useUpsertSelfOverride();
  const deleteOverride = useDeleteSelfOverride();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const range = useMemo(() => monthRange(monthCursor), [monthCursor]);
  const {
    data: overrides = [],
    isLoading: overridesLoading,
    refetch: refetchOverrides,
  } = useSelfOverrides(range.from, range.to);

  const displayName = staff
    ? (staff.display_name?.trim() ||
        `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim() ||
        "…")
    : "…";

  const initials = staff
    ? `${staff.first_name?.[0] ?? ""}${staff.last_name?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

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

  function startEditName() {
    setNameValue(displayName === "…" ? "" : displayName);
    setNameError(null);
    setEditingName(true);
  }

  function saveName() {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2) {
      setNameError("Le nom doit contenir au moins 2 caractères");
      toast.warning("Nom invalide", "Le nom doit contenir au moins 2 caractères.");
      return;
    }
    updateProfile.mutate(
      { display_name: trimmed },
      {
        onSuccess: () => {
          setEditingName(false);
          setNameError(null);
          toast.success("Profil", "Nom mis à jour.");
        },
        onError: (err: Error) => {
          console.warn("[staff-profile] update name failed", err);
          setNameError(err.message || "Échec de la mise à jour");
          toast.error("Erreur", err.message || "Échec de la mise à jour");
        },
      },
    );
  }

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

              {editingName ? (
                <View style={styles.editNameBlock}>
                  <TextInput
                    style={styles.nameInput}
                    value={nameValue}
                    onChangeText={setNameValue}
                    autoFocus
                    placeholder="Nom affiché"
                    placeholderTextColor={ownerColors.textDim}
                  />
                  {nameError ? <Text style={styles.error}>{nameError}</Text> : null}
                  <View style={styles.editActions}>
                    <Pressable
                      style={styles.cancelNameBtn}
                      onPress={() => setEditingName(false)}
                      disabled={updateProfile.isPending}>
                      <Text style={styles.cancelNameText}>Annuler</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.saveNameBtn,
                        updateProfile.isPending && styles.disabled,
                      ]}
                      onPress={saveName}
                      disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveNameText}>Sauver</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.name}>{displayName}</Text>
                  <Pressable onPress={startEditName} style={styles.editNameLink}>
                    <Text style={styles.editNameLinkText}>Modifier le nom</Text>
                  </Pressable>
                </>
              )}

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

            <SelfScheduleEditor
              workingHours={staff?.working_hours ?? []}
              busy={updateSchedule.isPending}
              onSave={(schedule) => {
                console.log("[staff-profile] save schedule", schedule);
                updateSchedule.mutate(schedule, {
                  onSuccess: () => {
                    toast.success("Horaires", "Horaires enregistrés.");
                  },
                  onError: (err: Error) => {
                    console.warn("[staff-profile] save schedule failed", err);
                    toast.error(
                      "Horaires",
                      err.message || "Échec de l'enregistrement",
                    );
                  },
                });
              }}
            />

            <View style={styles.exceptionsCard}>
              <View style={styles.exceptionsHeader}>
                <Text style={styles.sectionTitle}>Exceptions / congés</Text>
                <Pressable
                  style={styles.addBtn}
                  onPress={() => {
                    setOverrideError(null);
                    setExceptionOpen(true);
                  }}>
                  <Text style={styles.addBtnText}>+ Ajouter</Text>
                </Pressable>
              </View>

              <View style={styles.monthNav}>
                <Pressable
                  style={styles.monthBtn}
                  onPress={() =>
                    setMonthCursor(
                      (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
                    )
                  }>
                  <Text style={styles.monthBtnText}>‹</Text>
                </Pressable>
                <Text style={styles.monthLabel}>{range.label}</Text>
                <Pressable
                  style={styles.monthBtn}
                  onPress={() =>
                    setMonthCursor(
                      (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
                    )
                  }>
                  <Text style={styles.monthBtnText}>›</Text>
                </Pressable>
              </View>

              {overridesLoading ? (
                <ActivityIndicator color={ownerColors.primary} />
              ) : overrides.length === 0 ? (
                <Text style={styles.emptyOverrides}>
                  Aucune exception ce mois-ci.
                </Text>
              ) : (
                overrides.map((item) => (
                  <View key={item.id} style={styles.overrideRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.overrideDate}>{item.override_date}</Text>
                      <Text style={styles.overrideMeta}>
                        {item.is_available
                          ? `${item.start_time ?? "?"} – ${item.end_time ?? "?"}`
                          : "Jour off"}
                        {item.reason ? ` · ${item.reason}` : ""}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        Alert.alert(
                          "Supprimer",
                          `Supprimer l'exception du ${item.override_date} ?`,
                          [
                            { text: "Annuler", style: "cancel" },
                            {
                              text: "Supprimer",
                              style: "destructive",
                              onPress: () =>
                                deleteOverride.mutate(item.override_date, {
                                  onSuccess: () => {
                                    toast.success(
                                      "Exception",
                                      "Exception supprimée.",
                                    );
                                  },
                                  onError: (err: Error) =>
                                    toast.error(
                                      "Erreur",
                                      err.message || "Suppression impossible",
                                    ),
                                }),
                            },
                          ],
                        );
                      }}
                      disabled={deleteOverride.isPending}>
                      <Text style={styles.deleteText}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
              {overrideError ? (
                <Text style={styles.error}>{overrideError}</Text>
              ) : null}
            </View>

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
          </>
        )}
      </ScrollView>

      <AddExceptionSheet
        visible={exceptionOpen}
        defaultDate={range.from}
        busy={upsertOverride.isPending}
        onClose={() => setExceptionOpen(false)}
        onSave={(override) => {
          setOverrideError(null);
          upsertOverride.mutate(override, {
            onSuccess: () => {
              setExceptionOpen(false);
              void refetchOverrides();
              toast.success("Exception", "Exception enregistrée.");
            },
            onError: (err: Error) => {
              setOverrideError(err.message || "Échec de l'enregistrement");
              toast.error(
                "Erreur",
                err.message || "Échec de l'enregistrement",
              );
            },
          });
        }}
      />
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
  editNameLink: { marginTop: 4, marginBottom: 2 },
  editNameLinkText: {
    fontSize: 13,
    color: ownerColors.primary,
    fontFamily: ownerFonts.semiBold,
  },
  editNameBlock: { width: "100%", alignItems: "center", gap: 8 },
  nameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: ownerColors.text,
    backgroundColor: ownerColors.card,
    textAlign: "center",
    fontFamily: ownerFonts.regular,
  },
  editActions: { flexDirection: "row", gap: 10 },
  cancelNameBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  cancelNameText: {
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.semiBold,
  },
  saveNameBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: ownerColors.primary,
    minWidth: 80,
    alignItems: "center",
  },
  saveNameText: {
    color: "#fff",
    fontFamily: ownerFonts.semiBold,
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
  exceptionsCard: {
    ...ownerStyles.card,
    backgroundColor: ownerColors.primarySurface,
    marginBottom: 12,
  },
  exceptionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: ownerColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  monthBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ownerColors.card,
  },
  monthBtnText: {
    fontSize: 18,
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ownerColors.text,
    textTransform: "capitalize",
    fontFamily: ownerFonts.semiBold,
  },
  emptyOverrides: {
    fontSize: 13,
    color: ownerColors.textDim,
    fontFamily: ownerFonts.regular,
  },
  overrideRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  overrideDate: {
    fontSize: 14,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
  },
  overrideMeta: {
    fontSize: 12,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  deleteText: {
    fontSize: 16,
    color: ownerColors.danger,
    paddingHorizontal: 8,
    fontFamily: ownerFonts.bold,
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
  error: {
    color: ownerColors.danger,
    fontSize: 13,
    marginTop: 4,
    fontFamily: ownerFonts.regular,
  },
  disabled: { opacity: 0.7 },
});
