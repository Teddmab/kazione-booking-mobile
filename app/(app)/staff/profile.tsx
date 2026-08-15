import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AddExceptionSheet } from "@/components/staff/AddExceptionSheet";
import { SelfScheduleEditor } from "@/components/staff/SelfScheduleEditor";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useDeleteSelfOverride,
  useMyCommissions,
  useSelfOverrides,
  useStaffSelf,
  useUpdateBankAccount,
  useUpdateSelfProfile,
  useUpdateSelfSchedule,
  useUpsertSelfOverride,
} from "@/hooks/useStaffSelf";
import { authClient } from "@/lib/auth";
import { roleLabel } from "@/lib/workspaceRouting";

type MainTab = "resume" | "horaire" | "appearance" | "payment";
type ScheduleTab = "weekly" | "exceptions";

export default function StaffProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthContext();
  const { tenant } = useTenantContext();
  const { data: staff, isLoading } = useStaffSelf();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const updateProfile = useUpdateSelfProfile();
  const updateSchedule = useUpdateSelfSchedule();
  const upsertOverride = useUpsertSelfOverride();
  const deleteOverride = useDeleteSelfOverride();
  const updateBankAccountMutation = useUpdateBankAccount();

  const now = new Date();
  const commissionFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const commissionTo = now.toISOString().slice(0, 10);
  const { data: commissionsData } = useMyCommissions({ from: commissionFrom, to: commissionTo });

  const [mainTab, setMainTab] = useState<MainTab>("resume");
  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>("weekly");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  // Bank account state
  const [bankIban, setBankIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankIsEntrepreneur, setBankIsEntrepreneur] = useState(false);
  const [bankEeAccepted, setBankEeAccepted] = useState(false);
  const [bankBusy, setBankBusy] = useState(false);

  const range = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const from = new Date(y, m, 1);
    const to = new Date(y, m + 1, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      from: `${y}-${pad(m + 1)}-01`,
      to: `${y}-${pad(m + 1)}-${pad(to.getDate())}`,
      label: from.toLocaleDateString(i18n.language || "en", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [monthCursor, i18n.language]);

  const {
    data: overrides = [],
    isLoading: overridesLoading,
    refetch: refetchOverrides,
  } = useSelfOverrides(range.from, range.to);

  // Sync bank account fields from loaded staff data
  const staffBankIban = staff?.bank_account_iban ?? "";
  const staffBankName = staff?.bank_account_bank_name ?? "";
  const staffBankHolder = staff?.bank_account_holder_name ?? "";
  const staffIsEntrepreneur = staff?.bank_account_is_entrepreneur ?? false;
  const staffEeAccepted = Boolean(staff?.bank_account_ee_accepted_at);

  // Re-initialize local state when staff data loads
  // (only if user hasn't started editing — check identity against loaded values)
  if (!bankBusy && staff && bankIban === "" && staffBankIban) setBankIban(staffBankIban);
  if (!bankBusy && staff && bankName === "" && staffBankName) setBankName(staffBankName);
  if (!bankBusy && staff && bankHolder === "" && staffBankHolder) setBankHolder(staffBankHolder);

  function formatIban(raw: string) {
    return raw.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
  }

  async function saveBankAccount() {
    setBankBusy(true);
    try {
      await updateBankAccountMutation.mutateAsync({
        iban: bankIban.replace(/\s/g, ""),
        bank_name: bankName,
        holder_name: bankHolder,
        is_entrepreneur: bankIsEntrepreneur,
        ee_accepted: bankEeAccepted,
      });
      toast.success("Bank account", "Details saved");
    } catch (err) {
      toast.error("Save failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBankBusy(false);
    }
  }

  const displayName = staff
    ? (staff.display_name?.trim() ||
        `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim() ||
        "—")
    : "—";

  function startEditName() {
    setNameValue(displayName === "—" ? "" : displayName);
    setEditingName(true);
  }

  function saveName() {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2) {
      toast.warning(t("staffAccount.labelName"), t("staffAccount.pwMinError"));
      return;
    }
    updateProfile.mutate(
      { display_name: trimmed },
      {
        onSuccess: () => {
          setEditingName(false);
          toast.success(t("staffAccount.profileTitle"), "OK");
        },
        onError: (err: Error) => {
          toast.error(t("staffAccount.errorSave"), err.message);
        },
      },
    );
  }

  async function savePassword() {
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError(t("staffAccount.pwMinError"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("staffAccount.pwMatchError"));
      return;
    }
    setPasswordBusy(true);
    try {
      const { error } = await authClient.updatePassword(newPassword);
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("staffAccount.passwordTitle"), t("staffAccount.pwUpdated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("staffAccount.pwFailed");
      setPasswordError(msg);
      toast.error(t("staffAccount.errorSave"), msg);
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={t("staffAccount.title")}
        subtitle={t("staffAccount.subtitle")}
        displayTitle
      />

      <View style={styles.tabs}>
        {(
          [
            { key: "resume" as const, label: t("staffAccount.tabResume"), icon: "person-outline" as const },
            { key: "horaire" as const, label: t("staffAccount.tabSchedule"), icon: "time-outline" as const },
            { key: "appearance" as const, label: t("appearance.title"), icon: "color-palette-outline" as const },
            { key: "payment" as const, label: "Payment", icon: "card-outline" as const },
          ]
        ).map((tab) => {
          const active = mainTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setMainTab(tab.key)}>
              <Ionicons
                name={tab.icon}
                size={14}
                color={active ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : mainTab === "resume" ? (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-outline" size={16} color={colors.primary} />
                <Text style={styles.cardTitle}>{t("staffAccount.profileTitle")}</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t("staffAccount.labelName")}</Text>
                {editingName ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={nameValue}
                      onChangeText={setNameValue}
                      autoFocus
                      placeholderTextColor={colors.textDim}
                    />
                    <Pressable style={styles.iconBtn} onPress={saveName} disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? (
                        <ActivityIndicator size="small" color={colors.success} />
                      ) : (
                        <Ionicons name="checkmark" size={20} color={colors.success} />
                      )}
                    </Pressable>
                    <Pressable style={styles.iconBtn} onPress={() => setEditingName(false)}>
                      <Ionicons name="close" size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.nameRow}>
                    <Text style={styles.value}>{displayName}</Text>
                    <Pressable style={styles.iconBtn} onPress={startEditName}>
                      <Ionicons name="pencil" size={14} color={colors.textMuted} />
                    </Pressable>
                  </View>
                )}
              </View>

              {staff?.position ? (
                <View style={styles.field}>
                  <Text style={styles.label}>{t("staffAccount.labelPosition")}</Text>
                  <Text style={styles.value}>{staff.position}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>{t("staffAccount.labelEmail")}</Text>
                <Text style={styles.value}>{staff?.email ?? user?.email ?? "—"}</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t("staffAccount.labelRole")}</Text>
                <Text style={styles.value}>
                  {roleLabel(
                    (staff?.role as "staff") ?? "staff",
                    staff?.position ?? tenant?.position,
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
                <Text style={styles.cardTitle}>{t("staffAccount.passwordTitle")}</Text>
              </View>

              <Text style={styles.label}>{t("staffAccount.newPassword")}</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t("staffAccount.passwordMin")}
                  placeholderTextColor={colors.textDim}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>

              <Text style={[styles.label, { marginTop: 10 }]}>
                {t("staffAccount.confirmPassword")}
              </Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t("staffAccount.repeatPassword")}
                placeholderTextColor={colors.textDim}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

              <Pressable
                style={[
                  styles.primaryBtn,
                  (passwordBusy || !newPassword || !confirmPassword) && styles.disabled,
                ]}
                disabled={passwordBusy || !newPassword || !confirmPassword}
                onPress={() => void savePassword()}>
                {passwordBusy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t("staffAccount.updatePassword")}</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : mainTab === "horaire" ? (
          <>
            <View style={styles.subTabs}>
              {(
                [
                  { key: "weekly" as const, label: t("staffAccount.weeklyTab") },
                  { key: "exceptions" as const, label: t("staffAccount.exceptionsTab") },
                ]
              ).map((tab) => {
                const active = scheduleTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    style={[styles.subTab, active && styles.subTabActive]}
                    onPress={() => setScheduleTab(tab.key)}>
                    <Text style={[styles.subTabText, active && styles.subTabTextActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {scheduleTab === "weekly" ? (
              <SelfScheduleEditor
                workingHours={staff?.working_hours ?? []}
                busy={updateSchedule.isPending}
                onSave={(schedule) => {
                  updateSchedule.mutate(schedule, {
                    onSuccess: () =>
                      toast.success(
                        t("staffAccount.scheduleTitle"),
                        t("staffAccount.schedulesSaved"),
                      ),
                    onError: (err: Error) =>
                      toast.error(t("staffAccount.errorSave"), err.message),
                  });
                }}
              />
            ) : (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.cardTitle}>{t("staffAccount.exceptionsTab")}</Text>
                </View>
                <Text style={styles.hint}>{t("staffAccount.exceptionsDesc")}</Text>

                <View style={styles.monthNav}>
                  <Pressable
                    style={styles.monthBtn}
                    onPress={() =>
                      setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                    }>
                    <Ionicons name="chevron-back" size={18} color={colors.text} />
                  </Pressable>
                  <Text style={styles.monthLabel}>{range.label}</Text>
                  <Pressable
                    style={styles.monthBtn}
                    onPress={() =>
                      setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                    }>
                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                  </Pressable>
                </View>

                {overridesLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : overrides.length === 0 ? (
                  <Text style={styles.emptyOverrides}>{t("staffAccount.noExceptions")}</Text>
                ) : (
                  overrides.map((item) => (
                    <View key={item.id} style={styles.overrideRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.overrideDate}>{item.override_date}</Text>
                        <Text style={styles.overrideMeta}>
                          {item.is_available
                            ? `${item.start_time ?? "?"} – ${item.end_time ?? "?"}`
                            : t("staffAccount.dayOff")}
                          {item.reason ? ` · ${item.reason}` : ""}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            t("staffAccount.cancelBtn"),
                            item.override_date,
                            [
                              { text: t("staffAccount.cancelBtn"), style: "cancel" },
                              {
                                text: "OK",
                                style: "destructive",
                                onPress: () =>
                                  deleteOverride.mutate(item.override_date, {
                                    onSuccess: () =>
                                      toast.success(
                                        t("staffAccount.exceptionsTab"),
                                        t("staffAccount.exceptionSaved"),
                                      ),
                                    onError: (err: Error) =>
                                      toast.error(t("staffAccount.errorSave"), err.message),
                                  }),
                              },
                            ],
                          );
                        }}
                        disabled={deleteOverride.isPending}>
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  ))
                )}

                <Pressable style={styles.outlineBtn} onPress={() => setExceptionOpen(true)}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={styles.outlineBtnText}>{t("staffAccount.addException")}</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : mainTab === "appearance" ? (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="color-palette-outline" size={16} color={colors.primary} />
                <Text style={styles.cardTitle}>{t("appearance.title")}</Text>
              </View>
              <Text style={styles.hint}>{t("appearance.themeHint")}</Text>
              <ThemeToggle />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
                <Text style={styles.cardTitle}>{t("appearance.language")}</Text>
              </View>
              <LanguageSelector variant="list" />
            </View>
          </>
        ) : (
          /* Payment / Bank Account tab */
          <>
            {/* Estonian entrepreneur account warning — always shown for EE pilot */}
            <View style={styles.eeWarning}>
              <Ionicons name="warning-outline" size={18} color="#92400e" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.eeWarningTitle}>Commission payments in Estonia</Text>
                <Text style={styles.eeWarningText}>
                  Estonian law requires commission income to be received via a business
                  account (FIE or OÜ). Personal accounts (regular LHV, SEB, Swedbank) cannot
                  be used. Contact your bank to open an entrepreneur account.
                </Text>
                <Pressable
                  style={styles.eeCheckRow}
                  onPress={() => setBankEeAccepted((v) => !v)}>
                  <View style={[styles.checkbox, bankEeAccepted && styles.checkboxChecked]}>
                    {bankEeAccepted && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>
                  <Text style={styles.eeCheckLabel}>
                    I understand — I will provide a business account
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="card-outline" size={16} color={colors.primary} />
                <Text style={styles.cardTitle}>Bank Account Details</Text>
              </View>

              {/* Commission summary for this month */}
              {commissionsData && (
                <View style={styles.commissionSummary}>
                  <View style={styles.commissionSummaryItem}>
                    <Text style={styles.commissionSummaryLabel}>This month</Text>
                    <Text style={styles.commissionSummaryValue}>
                      €{commissionsData.summary.total_earned.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.commissionSummaryDivider} />
                  <View style={styles.commissionSummaryItem}>
                    <Text style={styles.commissionSummaryLabel}>Paid</Text>
                    <Text style={[styles.commissionSummaryValue, { color: colors.success }]}>
                      €{commissionsData.summary.total_paid.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.commissionSummaryDivider} />
                  <View style={styles.commissionSummaryItem}>
                    <Text style={styles.commissionSummaryLabel}>Pending</Text>
                    <Text style={[styles.commissionSummaryValue, { color: "#d97706" }]}>
                      €{commissionsData.summary.total_unpaid.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Account holder name</Text>
                <TextInput
                  style={styles.input}
                  value={bankHolder}
                  onChangeText={setBankHolder}
                  placeholder="Full legal name on account"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>IBAN</Text>
                <TextInput
                  style={[styles.input, { fontFamily: "monospace" as const }]}
                  value={bankIban}
                  onChangeText={(v) => setBankIban(formatIban(v))}
                  placeholder="EE38 2200 2210 1234 5678"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Bank name</Text>
                <TextInput
                  style={styles.input}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. LHV, SEB, Swedbank"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <Pressable
                style={styles.eeCheckRow}
                onPress={() => setBankIsEntrepreneur((v) => !v)}>
                <View style={[styles.checkbox, bankIsEntrepreneur && styles.checkboxChecked]}>
                  {bankIsEntrepreneur && <Ionicons name="checkmark" size={11} color="#fff" />}
                </View>
                <Text style={styles.hint}>
                  This is my entrepreneur / business account (FIE or OÜ)
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.primaryBtn,
                  (bankBusy || !bankHolder || !bankIban) && styles.disabled,
                ]}
                disabled={bankBusy || !bankHolder || !bankIban}
                onPress={() => void saveBankAccount()}>
                {bankBusy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save bank details</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <AddExceptionSheet
        visible={exceptionOpen}
        defaultDate={range.from}
        busy={upsertOverride.isPending}
        onClose={() => setExceptionOpen(false)}
        onSave={(override) => {
          upsertOverride.mutate(override, {
            onSuccess: () => {
              setExceptionOpen(false);
              void refetchOverrides();
              toast.success(
                t("staffAccount.exceptionsTab"),
                t("staffAccount.exceptionSaved"),
              );
            },
            onError: (err: Error) => {
              toast.error(t("staffAccount.errorSave"), err.message);
            },
          });
        }}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    tabs: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      backgroundColor: colors.primarySurface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
      gap: 4,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 10,
      borderRadius: 9,
    },
    tabActive: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    tabTextActive: {
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    container: { padding: 16, gap: 14, paddingBottom: 40 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    field: { gap: 4 },
    label: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    value: {
      fontSize: 15,
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    editRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    iconBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.bg,
      fontFamily: ownerFonts.regular,
    },
    passwordWrap: { position: "relative" },
    passwordInput: { paddingRight: 44 },
    eyeBtn: {
      position: "absolute",
      right: 10,
      top: 0,
      bottom: 0,
      justifyContent: "center",
    },
    primaryBtn: {
      marginTop: 6,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    subTabs: {
      flexDirection: "row",
      backgroundColor: colors.primarySurface,
      borderRadius: 10,
      padding: 3,
      gap: 3,
    },
    subTab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 8,
      borderRadius: 8,
    },
    subTabActive: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    subTabText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    subTabTextActive: {
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    monthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    monthBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    monthLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      textTransform: "capitalize",
      fontFamily: ownerFonts.semiBold,
    },
    emptyOverrides: {
      fontSize: 13,
      color: colors.textDim,
      textAlign: "center",
      paddingVertical: 16,
      fontFamily: ownerFonts.regular,
    },
    overrideRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    overrideDate: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    overrideMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    outlineBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    outlineBtnText: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      marginTop: 4,
      fontFamily: ownerFonts.regular,
    },
    disabled: { opacity: 0.55 },
    eeWarning: {
      flexDirection: "row",
      gap: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#fde68a",
      backgroundColor: "#fffbeb",
      padding: 14,
    },
    eeWarningTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#92400e",
      fontFamily: ownerFonts.semiBold,
    },
    eeWarningText: {
      fontSize: 12,
      lineHeight: 18,
      color: "#92400e",
      fontFamily: ownerFonts.regular,
    },
    eeCheckRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    eeCheckLabel: {
      fontSize: 12,
      color: "#92400e",
      flex: 1,
      fontFamily: ownerFonts.medium,
    },
    checkbox: {
      width: 16,
      height: 16,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    commissionSummary: {
      flexDirection: "row",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    commissionSummaryItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      gap: 2,
    },
    commissionSummaryDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    commissionSummaryLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    commissionSummaryValue: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
  });
}
