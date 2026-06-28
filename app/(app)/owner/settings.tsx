import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { LanguageFlagPicker } from "@/components/owner/LanguageFlagPicker";
import { OperatingHoursEditor } from "@/components/owner/OperatingHoursEditor";
import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { QueryState } from "@/components/owner/QueryState";
import { SettingsPickerRow } from "@/components/owner/SettingsPickerRow";
import { SettingsSecurityTab } from "@/components/owner/SettingsSecurityTab";
import {
  createDefaultRolePermissions,
  SettingsTeamTab,
} from "@/components/owner/SettingsTeamTab";
import { SwitchRow } from "@/components/owner/SwitchRow";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import { useBusinessSettings, useUpdateBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCreateBusiness } from "@/hooks/useCreateBusiness";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useBusinessStorefront,
  useStripeConnectStatus,
  useStripeOnboarding,
  useUpdateBusinessStorefront,
} from "@/hooks/useOwnerBusinessSettings";
import { useOwnerBusiness } from "@/hooks/useOwnerBusiness";
import { usePayPalConnect } from "@/hooks/usePayPalConnect";
import { usePublishStorefront } from "@/hooks/useOwnerStorefront";
import { useUpdateOwnerBusiness } from "@/hooks/useUpdateOwnerBusiness";
import { useUpdateUserProfile, useUserProfile } from "@/hooks/useUserProfile";
import { mergeOperatingHours, validateOperatingHours } from "@/lib/operatingHours";
import {
  BUSINESS_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  REMINDER_HOUR_OPTIONS,
  STOREFRONT_LOCALE_OPTIONS,
  reminderHoursLabel,
  type RolePermissions,
} from "@/lib/settingsConstants";
import type { DayHours } from "@/types/owner";

type SettingsTab =
  | "profile"
  | "business"
  | "hours"
  | "notifications"
  | "booking"
  | "payments"
  | "language"
  | "team"
  | "security";

type PickerKind =
  | "businessType"
  | "country"
  | "reminder"
  | "storefrontLocale"
  | "currency"
  | "dateFormat";

const PAYMENT_METHODS = [
  { id: "deposit", label: "Acompte" },
  { id: "full", label: "Paiement complet" },
  { id: "later", label: "Payer sur place" },
] as const;

function showOptionSheet(title: string, options: string[], onPick: (index: number) => void) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      { title, options: [...options, "Annuler"], cancelButtonIndex: options.length },
      (index) => {
        if (index < options.length) onPick(index);
      },
    );
    return;
  }
  Alert.alert(
    title,
    undefined,
    [
      ...options.map((label, index) => ({ text: label, onPress: () => onPick(index) })),
      { text: "Annuler", style: "cancel" },
    ],
  );
}

export default function OwnerSettingsScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuthContext();
  const { tenant, businesses, setActiveBusiness } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [businessPickerOpen, setBusinessPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [pickerKind, setPickerKind] = useState<PickerKind | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(
    createDefaultRolePermissions(),
  );

  const profileQuery = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const ownerBusinessQuery = useOwnerBusiness(businessId);
  const updateOwnerBusiness = useUpdateOwnerBusiness(businessId);
  const businessQuery = useBusinessStorefront(businessId);
  const updateBusiness = useUpdateBusinessStorefront(businessId);
  const publishStorefront = usePublishStorefront(businessId);
  const settingsQuery = useBusinessSettings(businessId);
  const updateSettings = useUpdateBusinessSettings(businessId);
  const stripeStatus = useStripeConnectStatus(businessId);
  const stripeOnboard = useStripeOnboarding(businessId);
  const paypal = usePayPalConnect(businessId);
  const createBusiness = useCreateBusiness();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [salonName, setSalonName] = useState("");
  const [bizType, setBizType] = useState("hair_salon");
  const [bizEmail, setBizEmail] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [bizWebsite, setBizWebsite] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [storefrontPublished, setStorefrontPublished] = useState(false);

  const [hours, setHours] = useState<Record<string, DayHours>>(mergeOperatingHours(null));
  const [notifyBooking, setNotifyBooking] = useState(true);
  const [notifyCancel, setNotifyCancel] = useState(true);
  const [notifyDaily, setNotifyDaily] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(true);
  const [notifyMessage, setNotifyMessage] = useState(true);
  const [reminderHours, setReminderHours] = useState(24);

  const [depositPercent, setDepositPercent] = useState("25");
  const [cancellationHours, setCancellationHours] = useState("24");
  const [rescheduleHours, setRescheduleHours] = useState("24");
  const [maxAdvanceDays, setMaxAdvanceDays] = useState("60");
  const [bufferMinutes, setBufferMinutes] = useState("0");
  const [allowPayLater, setAllowPayLater] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(true);

  const [enabledMethods, setEnabledMethods] = useState<string[]>(["deposit", "full", "later"]);
  const [paypalEmail, setPaypalEmail] = useState("");

  const [storefrontLocale, setStorefrontLocale] = useState("auto");
  const [currencyCode, setCurrencyCode] = useState("EUR");
  const [dateFormat, setDateFormat] = useState("dmy");

  useEffect(() => {
    const p = profileQuery.data;
    if (p) {
      setFirstName(p.first_name ?? "");
      setLastName(p.last_name ?? "");
      setPhone(p.phone ?? "");
    }
  }, [profileQuery.data]);

  useEffect(() => {
    const b = ownerBusinessQuery.data;
    if (b) {
      setSalonName(b.name ?? "");
      setBizType(b.business_type ?? "hair_salon");
      if (b.country) setCountryCode(b.country);
    }
  }, [ownerBusinessQuery.data]);

  useEffect(() => {
    const b = businessQuery.data;
    if (b) {
      setSalonName((prev) => b.title ?? prev);
      setCity(b.city ?? "");
      setSalonPhone(b.phone ?? "");
      setBizEmail(b.email ?? "");
      setBizAddress(b.address ?? "");
      if (b.country_code) setCountryCode(b.country_code);
      setBizWebsite(b.website ?? "");
      setStorefrontPublished(b.is_published);
    }
  }, [businessQuery.data]);

  useEffect(() => {
    const s = settingsQuery.data?.settings;
    if (!s) return;
    setHours(mergeOperatingHours(s.operating_hours));
    setNotifyBooking(s.notify_new_booking);
    setNotifyCancel(s.notify_cancellation);
    setNotifyDaily(s.notify_daily_summary);
    setNotifyWeekly(s.notify_weekly_report);
    setNotifyMessage(s.notify_client_message);
    setReminderHours(s.reminder_hours_before ?? 24);
    setDepositPercent(String(s.deposit_percent));
    setCancellationHours(String(s.cancellation_hours));
    setRescheduleHours(String(s.reschedule_hours));
    setMaxAdvanceDays(String(s.max_advance_days));
    setBufferMinutes(String(s.buffer_minutes));
    setAllowPayLater(s.allow_pay_later);
    setAutoConfirm(s.auto_confirm);
    setEnabledMethods(s.enabled_payment_methods ?? ["deposit", "full", "later"]);
    setStorefrontLocale(s.storefront_locale ?? "auto");
    setCurrencyCode(s.currency_code ?? "EUR");
    setDateFormat(s.date_format ?? "dmy");
  }, [settingsQuery.data]);

  useEffect(() => {
    if (paypal.status.data?.paypal_email) {
      setPaypalEmail(paypal.status.data.paypal_email);
    }
  }, [paypal.status.data?.paypal_email]);

  const tabs = useMemo(
    () => [
      { key: "profile" as const, label: t("owner.settingsProfile") },
      { key: "business" as const, label: t("owner.settingsBusiness") },
      { key: "hours" as const, label: "Horaires" },
      { key: "notifications" as const, label: t("owner.settingsNotifications") },
      { key: "booking" as const, label: "Réservation" },
      { key: "payments" as const, label: t("owner.settingsPayments") },
      { key: "language" as const, label: t("owner.settingsPreferences") },
      { key: "team" as const, label: "Équipe" },
      { key: "security" as const, label: "Sécurité" },
    ],
    [t],
  );

  const bizTypeLabel =
    BUSINESS_TYPE_OPTIONS.find((o) => o.value === bizType)?.label ?? bizType;
  const countryLabel =
    COUNTRY_OPTIONS.find((o) => o.code === countryCode)?.label ??
    (countryCode || "Choisir");
  const storefrontLocaleLabel =
    STOREFRONT_LOCALE_OPTIONS.find((o) => o.value === storefrontLocale)?.label ?? storefrontLocale;
  const currencyLabel =
    CURRENCY_OPTIONS.find((o) => o.value === currencyCode)?.label ?? currencyCode;
  const dateFormatLabel =
    DATE_FORMAT_OPTIONS.find((o) => o.value === dateFormat)?.label ?? dateFormat;

  const stripeConnected = !!stripeStatus.data?.connected;

  const openPicker = (kind: PickerKind) => {
    if (Platform.OS === "ios") {
      if (kind === "businessType") {
        showOptionSheet(
          "Type de salon",
          BUSINESS_TYPE_OPTIONS.map((o) => o.label),
          (i) => setBizType(BUSINESS_TYPE_OPTIONS[i].value),
        );
      } else if (kind === "country") {
        setPickerKind("country");
      } else if (kind === "reminder") {
        showOptionSheet(
          "Rappel client",
          REMINDER_HOUR_OPTIONS.map((h) => reminderHoursLabel(h)),
          (i) => setReminderHours(REMINDER_HOUR_OPTIONS[i]),
        );
      } else if (kind === "storefrontLocale") {
        showOptionSheet(
          "Langue boutique",
          STOREFRONT_LOCALE_OPTIONS.map((o) => o.label),
          (i) => setStorefrontLocale(STOREFRONT_LOCALE_OPTIONS[i].value),
        );
      } else if (kind === "currency") {
        showOptionSheet(
          "Devise",
          CURRENCY_OPTIONS.map((o) => o.label),
          (i) => setCurrencyCode(CURRENCY_OPTIONS[i].value),
        );
      } else if (kind === "dateFormat") {
        showOptionSheet(
          "Format de date",
          DATE_FORMAT_OPTIONS.map((o) => o.label),
          (i) => setDateFormat(DATE_FORMAT_OPTIONS[i].value),
        );
      }
      return;
    }
    setPickerKind(kind);
  };

  const saveProfile = () => {
    updateProfile.mutate(
      {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
      },
      { onSuccess: () => toast.success("Enregistré", "Profil mis à jour.") },
    );
  };

  const saveBusiness = async () => {
    try {
      await Promise.all([
        updateOwnerBusiness.mutateAsync({
          name: salonName.trim(),
          business_type: bizType,
          country: countryCode || null,
        }),
        updateBusiness.mutateAsync({
          title: salonName.trim() || null,
          email: bizEmail.trim() || null,
          phone: salonPhone.trim() || null,
          address: bizAddress.trim() || null,
          city: city.trim() || null,
          country_code: countryCode || null,
          website: bizWebsite.trim() || null,
        }),
      ]);
      toast.success("Enregistré", "Profil salon mis à jour.");
    } catch (e) {
      toast.error("Erreur", e instanceof Error ? e.message : "Échec de l'enregistrement.");
    }
  };

  const saveHours = () => {
    const err = validateOperatingHours(hours);
    if (err) {
      toast.warning("Horaires invalides", err);
      return;
    }
    updateSettings.mutate(
      { operating_hours: hours },
      { onSuccess: () => toast.success("Enregistré", "Horaires mis à jour.") },
    );
  };

  const saveNotifications = () => {
    updateSettings.mutate(
      {
        notify_new_booking: notifyBooking,
        notify_cancellation: notifyCancel,
        notify_daily_summary: notifyDaily,
        notify_weekly_report: notifyWeekly,
        notify_client_message: notifyMessage,
        reminder_hours_before: reminderHours,
      },
      { onSuccess: () => toast.success("Enregistré", "Notifications mises à jour.") },
    );
  };

  const saveBookingRules = () => {
    updateSettings.mutate(
      {
        deposit_percent: Number(depositPercent) || 0,
        cancellation_hours: Number(cancellationHours) || 24,
        reschedule_hours: Number(rescheduleHours) || 24,
        max_advance_days: Number(maxAdvanceDays) || 60,
        buffer_minutes: Number(bufferMinutes) || 0,
        allow_pay_later: allowPayLater,
        auto_confirm: autoConfirm,
      },
      { onSuccess: () => toast.success("Enregistré", "Règles de réservation mises à jour.") },
    );
  };

  const savePaymentMethods = () => {
    if (enabledMethods.length === 0) {
      toast.warning("Méthodes requises", "Au moins une méthode de paiement doit être activée.");
      return;
    }
    updateSettings.mutate(
      {
        enabled_payment_methods: enabledMethods,
        deposit_percent: Number(depositPercent) || 0,
      },
      { onSuccess: () => toast.success("Enregistré", "Modes de paiement mis à jour.") },
    );
  };

  const saveLanguage = async () => {
    try {
      await setLanguage(language);
      updateSettings.mutate(
        {
          admin_locale: language,
          storefront_locale: storefrontLocale,
          currency_code: currencyCode,
          date_format: dateFormat,
        },
        { onSuccess: () => toast.success("Enregistré", "Préférences enregistrées.") },
      );
    } catch (e) {
      toast.error("Erreur", e instanceof Error ? e.message : "Échec de l'enregistrement.");
    }
  };

  const saveTeamPermissions = () => {
    toast.success("Enregistré", "Permissions enregistrées (session locale, comme sur le web).");
  };

  const togglePaymentMethod = (id: string) => {
    if (id === "full" && !stripeConnected) {
      toast.warning("Stripe requis", "Connectez Stripe pour activer le paiement complet en ligne.");
      return;
    }
    setEnabledMethods((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          toast.warning("Méthodes requises", "Au moins une méthode de paiement doit rester activée.");
          return prev;
        }
        return prev.filter((m) => m !== id);
      }
      return [...prev, id];
    });
  };

  const toggleStorefrontPublished = (checked: boolean) => {
    publishStorefront.mutate(checked, {
      onSuccess: () => {
        setStorefrontPublished(checked);
        toast.success(
          checked ? "Salon visible" : "Salon masqué",
          checked
            ? "Votre page publique est accessible aux clients."
            : "La page publique est masquée.",
        );
      },
      onError: (e) => toast.error("Erreur", e.message),
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

  const connectPaypal = () => {
    const email = paypalEmail.trim();
    if (!email) {
      toast.warning("Email requis", "Entrez l'email PayPal du salon.");
      return;
    }
    paypal.connect.mutate(email, {
      onSuccess: () => toast.success("PayPal", "Connexion enregistrée."),
      onError: (e) => toast.error("Erreur", e.message),
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

  const pickerOptions = useMemo(() => {
    if (pickerKind === "country") {
      return COUNTRY_OPTIONS.map((c) => ({ key: c.code, label: c.label }));
    }
    if (pickerKind === "businessType") {
      return BUSINESS_TYPE_OPTIONS.map((c) => ({ key: c.value, label: c.label }));
    }
    if (pickerKind === "reminder") {
      return REMINDER_HOUR_OPTIONS.map((h) => ({
        key: String(h),
        label: reminderHoursLabel(h),
      }));
    }
    if (pickerKind === "storefrontLocale") {
      return STOREFRONT_LOCALE_OPTIONS.map((c) => ({ key: c.value, label: c.label }));
    }
    if (pickerKind === "currency") {
      return CURRENCY_OPTIONS.map((c) => ({ key: c.value, label: c.label }));
    }
    if (pickerKind === "dateFormat") {
      return DATE_FORMAT_OPTIONS.map((c) => ({ key: c.value, label: c.label }));
    }
    return [];
  }, [pickerKind]);

  const onPickerSelect = (key: string) => {
    if (pickerKind === "country") setCountryCode(key);
    if (pickerKind === "businessType") setBizType(key);
    if (pickerKind === "reminder") setReminderHours(Number(key));
    if (pickerKind === "storefrontLocale") setStorefrontLocale(key);
    if (pickerKind === "currency") setCurrencyCode(key);
    if (pickerKind === "dateFormat") setDateFormat(key);
    setPickerKind(null);
  };

  const refreshing =
    profileQuery.isRefetching ||
    businessQuery.isRefetching ||
    settingsQuery.isRefetching ||
    ownerBusinessQuery.isRefetching;

  const settingsLoading =
    profileQuery.isLoading ||
    businessQuery.isLoading ||
    settingsQuery.isLoading ||
    ownerBusinessQuery.isLoading;

  const businessSaving = updateBusiness.isPending || updateOwnerBusiness.isPending;

  return (
    <OwnerStackShell title={t("owner.settings")}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void profileQuery.refetch();
              void businessQuery.refetch();
              void settingsQuery.refetch();
              void ownerBusinessQuery.refetch();
              void stripeStatus.refetch();
              void paypal.status.refetch();
            }}
          />
        }>
        <Pressable style={styles.businessPicker} onPress={() => setBusinessPickerOpen(true)}>
          <Text style={styles.businessPickerLabel}>{t("owner.currentBusiness")}</Text>
          <Text style={styles.businessPickerValue}>{tenant?.businessName ?? "—"}</Text>
        </Pressable>

        <TabChipSelector value={tab} chips={tabs} onChange={setTab} />

        <QueryState
          loading={settingsLoading}
          error={profileQuery.isError ? (profileQuery.error as Error) : null}
          onRetry={() => void profileQuery.refetch()}>
          {tab === "profile" ? (
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
          ) : null}

          {tab === "business" ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t("owner.businessName")}</Text>
              <TextInput style={styles.input} value={salonName} onChangeText={setSalonName} />

              <SettingsPickerRow
                label="Type de salon"
                value={bizTypeLabel}
                onPress={() => openPicker("businessType")}
              />

              <Text style={[styles.label, styles.spaced]}>Email de contact</Text>
              <TextInput
                style={styles.input}
                value={bizEmail}
                onChangeText={setBizEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="hello@salon.ee"
              />

              <Text style={[styles.label, styles.spaced]}>{t("owner.phone")}</Text>
              <TextInput
                style={styles.input}
                value={salonPhone}
                onChangeText={setSalonPhone}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, styles.spaced]}>Adresse</Text>
              <TextInput
                style={styles.input}
                value={bizAddress}
                onChangeText={setBizAddress}
                placeholder="Rue et numéro"
              />

              <Text style={[styles.label, styles.spaced]}>{t("owner.city")}</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />

              <SettingsPickerRow label="Pays" value={countryLabel} onPress={() => openPicker("country")} />

              <Text style={[styles.label, styles.spaced]}>Site web</Text>
              <TextInput
                style={styles.input}
                value={bizWebsite}
                onChangeText={setBizWebsite}
                keyboardType="url"
                autoCapitalize="none"
                placeholder="https://..."
              />

              <View style={styles.switchBlock}>
                <View style={styles.switchText}>
                  <Text style={styles.switchTitle}>Salon visible sur le marketplace</Text>
                  <Text style={styles.switchHint}>
                    Votre salon apparaît dans la recherche publique.
                  </Text>
                </View>
                <Switch
                  value={storefrontPublished}
                  onValueChange={toggleStorefrontPublished}
                  disabled={publishStorefront.isPending}
                  trackColor={{ true: ownerColors.primary }}
                />
              </View>

              <Pressable
                style={[ownerStyles.primaryBtn, styles.saveBtn, businessSaving && styles.disabled]}
                disabled={businessSaving}
                onPress={() => void saveBusiness()}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "hours" ? (
            <View style={styles.card}>
              <OperatingHoursEditor hours={hours} onChange={setHours} />
              <Pressable
                style={[ownerStyles.primaryBtn, styles.saveBtn, updateSettings.isPending && styles.disabled]}
                disabled={updateSettings.isPending}
                onPress={saveHours}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "notifications" ? (
            <View style={styles.card}>
              <SwitchRow label={t("owner.notifyBooking")} value={notifyBooking} onValueChange={setNotifyBooking} />
              <SwitchRow label={t("owner.notifyCancel")} value={notifyCancel} onValueChange={setNotifyCancel} />
              <SwitchRow label="Résumé quotidien" value={notifyDaily} onValueChange={setNotifyDaily} />
              <SwitchRow label="Rapport hebdomadaire" value={notifyWeekly} onValueChange={setNotifyWeekly} />
              <SwitchRow label="Messages clients" value={notifyMessage} onValueChange={setNotifyMessage} />

              <SettingsPickerRow
                label="Rappel avant le rendez-vous"
                value={reminderHoursLabel(reminderHours)}
                hint="Délai d'envoi du rappel email aux clients."
                onPress={() => openPicker("reminder")}
              />

              <Pressable
                style={[ownerStyles.primaryBtn, styles.saveBtn, updateSettings.isPending && styles.disabled]}
                disabled={updateSettings.isPending}
                onPress={saveNotifications}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "booking" ? (
            <View style={styles.card}>
              <Text style={styles.label}>Acompte (%)</Text>
              <TextInput
                style={styles.input}
                value={depositPercent}
                onChangeText={setDepositPercent}
                keyboardType="number-pad"
              />
              <Text style={[styles.label, styles.spaced]}>Annulation (heures avant)</Text>
              <TextInput
                style={styles.input}
                value={cancellationHours}
                onChangeText={setCancellationHours}
                keyboardType="number-pad"
              />
              <Text style={[styles.label, styles.spaced]}>Report (heures avant)</Text>
              <TextInput
                style={styles.input}
                value={rescheduleHours}
                onChangeText={setRescheduleHours}
                keyboardType="number-pad"
              />
              <Text style={[styles.label, styles.spaced]}>Réservation max (jours à l'avance)</Text>
              <TextInput
                style={styles.input}
                value={maxAdvanceDays}
                onChangeText={setMaxAdvanceDays}
                keyboardType="number-pad"
              />
              <Text style={[styles.label, styles.spaced]}>Tampon entre RDV (minutes)</Text>
              <TextInput
                style={styles.input}
                value={bufferMinutes}
                onChangeText={setBufferMinutes}
                keyboardType="number-pad"
              />
              <SwitchRow label="Payer sur place autorisé" value={allowPayLater} onValueChange={setAllowPayLater} />
              <SwitchRow label="Confirmation automatique" value={autoConfirm} onValueChange={setAutoConfirm} />
              <Pressable
                style={[ownerStyles.primaryBtn, styles.saveBtn, updateSettings.isPending && styles.disabled]}
                disabled={updateSettings.isPending}
                onPress={saveBookingRules}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "payments" ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Stripe</Text>
              <Text style={styles.value}>
                {stripeConnected ? t("owner.stripeConnected") : t("owner.stripeNotConnected")}
              </Text>
              {!stripeConnected ? (
                <Pressable style={[ownerStyles.outlineBtn, styles.saveBtn]} onPress={openStripe}>
                  <Text style={ownerStyles.outlineBtnText}>{t("owner.stripeConnect")}</Text>
                </Pressable>
              ) : null}

              <Text style={[styles.sectionTitle, styles.spaced]}>PayPal</Text>
              {paypal.status.data?.status === "coming_soon" ? (
                <Text style={styles.hint}>PayPal Connect arrive bientôt sur le backend.</Text>
              ) : paypal.status.data?.connected ? (
                <Text style={styles.value}>Connecté : {paypal.status.data.paypal_email}</Text>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    value={paypalEmail}
                    onChangeText={setPaypalEmail}
                    placeholder="email@paypal.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Pressable style={[ownerStyles.outlineBtn, styles.saveBtn]} onPress={connectPaypal}>
                    <Text style={ownerStyles.outlineBtnText}>Connecter PayPal</Text>
                  </Pressable>
                </>
              )}

              <Text style={[styles.sectionTitle, styles.spaced]}>Méthodes de paiement</Text>
              <View style={styles.chipRow}>
                {PAYMENT_METHODS.map((m) => {
                  const on = enabledMethods.includes(m.id);
                  const disabled = m.id === "full" && !stripeConnected;
                  return (
                    <Pressable
                      key={m.id}
                      style={[styles.chip, on && styles.chipOn, disabled && styles.chipDisabled]}
                      onPress={() => togglePaymentMethod(m.id)}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{m.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {!stripeConnected ? (
                <Text style={styles.hintWarn}>
                  Le paiement complet en ligne nécessite une connexion Stripe.
                </Text>
              ) : null}
              {enabledMethods.includes("deposit") ? (
                <>
                  <Text style={[styles.label, styles.spaced]}>Pourcentage d'acompte (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={depositPercent}
                    onChangeText={setDepositPercent}
                    keyboardType="number-pad"
                  />
                </>
              ) : null}
              <Pressable
                style={[ownerStyles.primaryBtn, styles.saveBtn, updateSettings.isPending && styles.disabled]}
                disabled={updateSettings.isPending}
                onPress={savePaymentMethods}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "language" ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t("owner.selectLanguage")} (admin)</Text>
              <View style={styles.langRow}>
                <LanguageFlagPicker />
              </View>

              <SettingsPickerRow
                label="Langue de la boutique"
                value={storefrontLocaleLabel}
                onPress={() => openPicker("storefrontLocale")}
              />
              <SettingsPickerRow
                label="Devise"
                value={currencyLabel}
                onPress={() => openPicker("currency")}
              />
              <SettingsPickerRow
                label="Format de date"
                value={dateFormatLabel}
                onPress={() => openPicker("dateFormat")}
              />

              <Pressable
                style={[ownerStyles.primaryBtn, styles.saveBtn, updateSettings.isPending && styles.disabled]}
                disabled={updateSettings.isPending}
                onPress={() => void saveLanguage()}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "team" ? (
            <SettingsTeamTab
              permissions={rolePermissions}
              onChange={setRolePermissions}
              onSave={saveTeamPermissions}
            />
          ) : null}

          {tab === "security" ? <SettingsSecurityTab /> : null}

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
          <Pressable
            style={styles.modalAdd}
            onPress={() => {
              setBusinessPickerOpen(false);
              setCreateOpen(true);
            }}>
            <Text style={styles.modalAddText}>+ {t("owner.addBusiness")}</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.createModal}>
          <Text style={styles.modalTitle}>{t("owner.addBusiness")}</Text>
          <TextInput
            style={styles.input}
            value={newBusinessName}
            onChangeText={setNewBusinessName}
            placeholder={t("owner.businessName")}
          />
          <Pressable style={ownerStyles.primaryBtn} onPress={submitCreateBusiness}>
            <Text style={ownerStyles.primaryBtnText}>{t("owner.createBusiness")}</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={pickerKind !== null && Platform.OS !== "ios"} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerKind(null)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Choisir</Text>
          <FlatList
            data={pickerOptions}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <Pressable style={styles.modalRow} onPress={() => onPickerSelect(item.key)}>
                <Text style={styles.modalRowText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </OwnerStackShell>
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
  sectionTitle: { fontSize: 15, fontWeight: "700", color: ownerColors.text },
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
  hint: { fontSize: 13, color: ownerColors.textMuted, lineHeight: 20, marginTop: 8 },
  hintWarn: { fontSize: 12, color: "#92400e", marginTop: 8, lineHeight: 18 },
  langRow: { marginTop: 10, alignSelf: "flex-start" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  chipOn: { backgroundColor: ownerColors.primaryMuted, borderColor: ownerColors.primary },
  chipDisabled: { opacity: 0.45 },
  chipText: { fontSize: 13, color: ownerColors.textMuted },
  chipTextOn: { color: ownerColors.primary, fontWeight: "600" },
  switchBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  switchText: { flex: 1 },
  switchTitle: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  switchHint: { fontSize: 12, color: ownerColors.textMuted, marginTop: 4, lineHeight: 17 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
    maxHeight: "60%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 12 },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  modalRowText: { fontSize: 16, color: ownerColors.text },
  modalActive: { color: ownerColors.primary, fontWeight: "700" },
  modalAdd: { marginTop: 16, paddingVertical: 12 },
  modalAddText: { fontSize: 15, fontWeight: "600", color: ownerColors.primary },
  createModal: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.5)" },
});
