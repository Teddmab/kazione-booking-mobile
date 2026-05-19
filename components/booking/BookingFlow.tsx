import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { StripePaymentSheet } from "@/components/booking/StripePaymentSheet";
import { SafeImage } from "@/components/SafeImage";
import { MOBILE_OPERATOR_OPTIONS, type MobileOperatorCode } from "@/constants/pawapayOperators";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAvailability } from "@/hooks/useAvailability";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { useStorefrontDetail } from "@/hooks/useMarketplace";
import {
  formatDayMonth,
  formatShortWeekday,
  nextCalendarDays,
  startOfToday,
  toLocalDateString,
} from "@/lib/dateUtils";
import { extractStripeKeyHint } from "@/lib/stripe";
import type { PaymentMethod } from "@/types/booking";
import type { StorefrontDetail } from "@/types/marketplace";
import {
  appointmentStatusFromPoll,
  createPawapayPayment,
  fetchAppointmentById,
} from "@/services/payments";

type Step =
  | "service"
  | "specialist"
  | "datetime"
  | "details"
  | "review"
  | "confirmed"
  | "payment_pending"
  | "stripe_checkout"
  | "mobile_money"
  | "mobile_money_waiting"
  | "mobile_money_timeout";

type PaymentPendingDetail = "web_fallback" | "stripe_key_mismatch" | "stripe_no_publishable_key";

const DATE_HORIZON = 21;
const DEPOSIT_PERCENT = 25;

function formatMoney(amount: number, code: string) {
  const sym = code === "EUR" ? "€" : code === "USD" ? "$" : "";
  return `${sym}${amount.toFixed(2)}`;
}

function categoriesFromStorefront(sf: StorefrontDetail): string[] {
  const cats = new Set(sf.services.map((s) => s.category));
  return Array.from(cats);
}

function staffForService(sf: StorefrontDetail, serviceId: string) {
  return (sf.team ?? []).filter((t) => t.serviceIds.includes(serviceId));
}

function stepOrder(sf: StorefrontDetail, serviceId: string | null): Step[] {
  const base: Step[] = ["service"];
  const svc = serviceId ? sf.services.find((s) => s.id === serviceId) : null;
  const showTeam =
    (sf.sections?.team ?? true) &&
    (sf.team ?? []).length > 0 &&
    svc &&
    staffForService(sf, svc.id).length > 0;
  if (showTeam) base.push("specialist");
  base.push("datetime", "details", "review");
  return base;
}

export default function BookingFlow({ slug }: { slug: string }) {
  const router = useRouter();
  const { user } = useAuthContext();
  const { data: storefront, isLoading, isError, error, refetch } = useStorefrontDetail(slug);

  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("later");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [paymentChannel, setPaymentChannel] = useState<"card" | "mobile_money">("card");
  const [mobileNetwork, setMobileNetwork] = useState<MobileOperatorCode>("MTN_MOMO_UGA");
  const [mmPhone, setMmPhone] = useState("");
  const [mmSubmitting, setMmSubmitting] = useState(false);
  const [mmError, setMmError] = useState<string | null>(null);
  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const [cardStripeAccountId, setCardStripeAccountId] = useState<string | null>(null);
  const [paymentPendingDetail, setPaymentPendingDetail] = useState<PaymentPendingDetail>("web_fallback");

  const selectedService = useMemo(
    () => storefront?.services.find((s) => s.id === serviceId) ?? null,
    [storefront, serviceId],
  );

  const depositAmount = useMemo(
    () => (selectedService ? Math.round(selectedService.price * (DEPOSIT_PERCENT / 100)) : 0),
    [selectedService],
  );

  const amountDueNow = useMemo(() => {
    if (paymentMethod === "deposit") return depositAmount;
    if (paymentMethod === "full") return selectedService?.price ?? 0;
    return 0;
  }, [depositAmount, paymentMethod, selectedService]);

  const dateStr = selectedDate ? toLocalDateString(selectedDate) : "";

  const { data: availability, isLoading: availLoading } = useAvailability({
    business_id: storefront?.businessId,
    service_id: serviceId ?? undefined,
    date: dateStr,
    staff_id: staffId ?? undefined,
    payment_method: paymentMethod,
  });

  const { mutateAsync: submitBooking, isPending: submitting, alternatives, clearAlternatives } =
    useCreateBooking();

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata as Record<string, string | undefined> | undefined;
    const full = meta?.full_name ?? meta?.name;
    if (full && !name) {
      setName(full);
    } else if (user.email && !name) {
      setName(user.email.split("@")[0] ?? "");
    }
    if (user.email && !email) setEmail(user.email);
  }, [user, name, email]);

  const orderedSteps = useMemo(() => {
    if (!storefront) return ["service"] as Step[];
    return stepOrder(storefront, serviceId);
  }, [storefront, serviceId]);

  useEffect(() => {
    if (!storefront) return;
    const terminal: Step[] = [
      "confirmed",
      "payment_pending",
      "stripe_checkout",
      "mobile_money",
      "mobile_money_waiting",
      "mobile_money_timeout",
    ];
    if (terminal.includes(step)) return;
    const o = stepOrder(storefront, serviceId);
    if (o.includes(step)) return;
    if (step === "specialist" && !o.includes("specialist")) {
      setStep("datetime");
      return;
    }
    setStep(o[0] ?? "service");
  }, [storefront, serviceId, step]);

  useEffect(() => {
    if (step === "mobile_money") {
      setMmPhone((p) => (p.trim() ? p : phone.trim()));
    }
  }, [step, phone]);

  useEffect(() => {
    if (step !== "mobile_money_waiting" || !appointmentId) {
      return;
    }
    const startedAt = Date.now();
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      if (Date.now() - startedAt >= 5 * 60 * 1000) {
        setStep("mobile_money_timeout");
        return;
      }
      try {
        const res = await fetchAppointmentById(appointmentId);
        if (appointmentStatusFromPoll(res)?.toLowerCase() === "confirmed") {
          setStep("confirmed");
        }
      } catch {
        /* keep polling */
      }
    };

    void poll();
    const intervalId = setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [step, appointmentId]);

  const progressStep: Step | null =
    step === "confirmed" ||
    step === "payment_pending" ||
    step === "stripe_checkout" ||
    step === "mobile_money" ||
    step === "mobile_money_waiting" ||
    step === "mobile_money_timeout"
      ? null
      : step;
  const pIdx = progressStep ? orderedSteps.indexOf(progressStep) : -1;

  const goNext = useCallback(() => {
    if (!storefront) return;
    const order = stepOrder(storefront, serviceId);
    const idx = order.indexOf(step);
    if (idx >= 0 && idx < order.length - 1) {
      setStep(order[idx + 1]!);
    }
  }, [storefront, serviceId, step]);

  const goBack = useCallback(() => {
    if (!storefront) return;
    const order = stepOrder(storefront, serviceId);
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]!);
    else router.back();
  }, [storefront, serviceId, step, router]);

  const canContinue = useMemo(() => {
    switch (step) {
      case "service":
        return !!serviceId;
      case "specialist":
        return true;
      case "datetime":
        return !!selectedDate && !!selectedTime;
      case "details":
        return (
          name.trim().length > 1 &&
          email.includes("@") &&
          phone.trim().length >= 6 &&
          gdprConsent
        );
      case "review":
        return true;
      default:
        return false;
    }
  }, [step, serviceId, selectedDate, selectedTime, name, email, gdprConsent]);

  const isValidMobileMoneyPhone = (value: string) => /^\+\d+$/.test(value) && value.length >= 10;

  const handleMobileMoneySubmit = async () => {
    if (!storefront || !appointmentId) {
      setMmError("Unable to start mobile money payment right now.");
      return;
    }
    const trimmed = mmPhone.trim();
    if (!isValidMobileMoneyPhone(trimmed)) {
      setMmError("Phone must start with + and contain only digits (min. 10 characters).");
      return;
    }
    const selectedOperator = MOBILE_OPERATOR_OPTIONS.find((o) => o.value === mobileNetwork);
    if (!selectedOperator) {
      setMmError("Please select a supported operator.");
      return;
    }
    setMmSubmitting(true);
    setMmError(null);
    try {
      const response = await createPawapayPayment({
        appointmentId,
        businessId: storefront.businessId,
        phone: trimmed,
        operatorCode: mobileNetwork,
        amount: amountDueNow.toFixed(2),
        currency: selectedOperator.currency,
      });
      const status = response?.status?.toUpperCase?.();
      if (status === "INITIATED") {
        setStep("mobile_money_waiting");
      } else {
        setMmError("Mobile money payment could not be started. Please try again.");
      }
    } catch (e) {
      setMmError(e instanceof Error ? e.message : "Mobile money payment failed. Please try again.");
    } finally {
      setMmSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!storefront || !selectedService || !dateStr || !selectedTime) return;
    setSubmitError(null);
    setPaymentPendingDetail("web_fallback");
    clearAlternatives();
    try {
      const selectedChannel = paymentMethod === "later" ? "card" : paymentChannel;
      const bookingPaymentMethod =
        paymentMethod !== "later" && selectedChannel === "mobile_money" ? "later" : paymentMethod;

      const result = await submitBooking({
        business_id: storefront.businessId,
        service_id: selectedService.id,
        staff_profile_id: staffId,
        date: dateStr,
        time: selectedTime,
        client: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: notes.trim() || undefined,
        },
        payment_method: bookingPaymentMethod,
        gdpr_consent: gdprConsent,
        locale: "en",
      });
      setBookingRef(result.booking_reference);
      setAppointmentId(result.appointment_id);
      setCardClientSecret(null);
      setCardStripeAccountId(null);
      setMmError(null);

      if (paymentMethod !== "later" && selectedChannel === "mobile_money") {
        setStep("mobile_money");
        return;
      }

      const pk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

      if (result.payment_intent_client_secret && paymentMethod !== "later") {
        const frontendHint = extractStripeKeyHint(pk);
        const backendHint = result.stripe_key_hint ?? null;
        if (frontendHint && backendHint && frontendHint !== backendHint) {
          setPaymentPendingDetail("stripe_key_mismatch");
          setStep("payment_pending");
          return;
        }
        if (!pk) {
          setPaymentPendingDetail("stripe_no_publishable_key");
          setStep("payment_pending");
          return;
        }
        setCardClientSecret(result.payment_intent_client_secret);
        setCardStripeAccountId(result.stripe_account_id ?? null);
        setStep("stripe_checkout");
        return;
      }

      setStep("confirmed");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Booking failed");
    }
  };

  const discardPaymentAndLeave = useCallback(() => {
    setCardClientSecret(null);
    setCardStripeAccountId(null);
    router.replace("/(app)/client");
  }, [router]);

  const dayStrip = useMemo(() => nextCalendarDays(startOfToday(), DATE_HORIZON), []);

  if (isLoading || !slug) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading salon…</Text>
      </View>
    );
  }

  if (isError || !storefront) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>Unable to load</Text>
        <Text style={styles.muted}>{error instanceof Error ? error.message : ""}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => void refetch()}>
          <Text style={styles.primaryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (storefront.services.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>No bookable services</Text>
        <Text style={styles.muted}>This salon has not published services yet.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "stripe_checkout" && cardClientSecret && bookingRef) {
    return (
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.confirmPad} keyboardShouldPersistTaps="handled">
          <Text style={styles.successTitle}>Complete payment</Text>
          <Text style={styles.body}>
            Reference: <Text style={styles.bold}>{bookingRef}</Text>
          </Text>
          <Text style={styles.mutedSmall}>
            Due now: {formatMoney(amountDueNow, storefront.currencyCode)}
          </Text>
          <StripePaymentSheet
            key={`${cardClientSecret}:${cardStripeAccountId ?? ""}`}
            stripeAccountId={cardStripeAccountId}
            clientSecret={cardClientSecret}
            billingName={name.trim()}
            billingEmail={email.trim()}
            billingPhone={phone.trim()}
            amountLabel={formatMoney(amountDueNow, storefront.currencyCode)}
            onPaid={() => {
              setCardClientSecret(null);
              setCardStripeAccountId(null);
              setStep("confirmed");
            }}
            onUserCancel={discardPaymentAndLeave}
          />
          <Pressable style={[styles.outlineBtn, { alignSelf: "stretch" }]} onPress={discardPaymentAndLeave}>
            <Text style={styles.outlineBtnText}>Cancel and return home</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (step === "mobile_money" || step === "mobile_money_waiting" || step === "mobile_money_timeout") {
    const opMeta = MOBILE_OPERATOR_OPTIONS.find((o) => o.value === mobileNetwork);
    const payCurrency = opMeta?.currency ?? storefront.currencyCode;

    if (step === "mobile_money_waiting") {
      return (
        <View style={[styles.flex, styles.center]}>
          <ActivityIndicator size="large" />
          <Text style={[styles.successTitle, { marginTop: 20, textAlign: "center" }]}>Waiting for payment</Text>
          <Text style={[styles.muted, { paddingHorizontal: 24 }]}>
            Approve the payment on your phone. This screen updates automatically.
          </Text>
          <Text style={styles.mutedSmall}>Ref. {bookingRef}</Text>
        </View>
      );
    }

    if (step === "mobile_money_timeout") {
      return (
        <View style={[styles.flex, styles.confirmPad]}>
          <Text style={styles.successTitle}>Payment timed out</Text>
          <Text style={styles.body}>
            We did not receive confirmation within a few minutes. Your booking may still be pending — check your email
            or contact the salon with reference <Text style={styles.bold}>{bookingRef}</Text>.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.replace("/(app)/client")}>
            <Text style={styles.primaryBtnText}>Back to Discover</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.confirmPad} keyboardShouldPersistTaps="handled">
          <Text style={styles.successTitle}>Mobile money</Text>
          <Text style={styles.body}>
            Pay <Text style={styles.bold}>{formatMoney(amountDueNow, payCurrency)}</Text> to confirm your booking.
          </Text>
          <Text style={styles.mutedSmall}>Reference: {bookingRef}</Text>
          <Text style={styles.subh}>Operator</Text>
          {MOBILE_OPERATOR_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              style={[styles.rowCard, mobileNetwork === o.value && styles.rowCardOn]}
              onPress={() => setMobileNetwork(o.value)}
            >
              <Text style={styles.rowTitle}>{o.label}</Text>
            </Pressable>
          ))}
          <Text style={styles.label}>Wallet phone number</Text>
          <TextInput
            style={styles.input}
            value={mmPhone}
            onChangeText={setMmPhone}
            keyboardType="phone-pad"
            placeholder="+256…"
          />
          {mmError ? <Text style={styles.errInline}>{mmError}</Text> : null}
          <Pressable
            style={[styles.primaryBtn, { marginTop: 20, alignSelf: "stretch" }, mmSubmitting && styles.disabled]}
            disabled={mmSubmitting}
            onPress={() => void handleMobileMoneySubmit()}
          >
            <Text style={styles.primaryBtnText}>{mmSubmitting ? "Starting…" : "Request payment"}</Text>
          </Pressable>
          <Pressable style={[styles.outlineBtn, { alignSelf: "stretch" }]} onPress={discardPaymentAndLeave}>
            <Text style={styles.outlineBtnText}>Cancel and return home</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "confirmed" || step === "payment_pending") {
    const pendingMessage =
      paymentPendingDetail === "stripe_key_mismatch"
        ? "Stripe key mismatch: the app publishable key does not match the salon payment account. Align EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY with the backend Stripe secret, then try again."
        : paymentPendingDetail === "stripe_no_publishable_key"
          ? "This build has no Stripe publishable key. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY, rebuild the app, or complete payment on the website."
          : "Card payment must be completed using the web app (Stripe). Your slot is held — open the same salon on the website to pay, or contact the salon.";

    return (
      <ScrollView contentContainerStyle={styles.confirmPad}>
        <Text style={styles.successTitle}>
          {step === "confirmed" ? "Booking confirmed" : "Booking created — payment pending"}
        </Text>
        <Text style={styles.body}>
          Reference: <Text style={styles.bold}>{bookingRef}</Text>
        </Text>
        {appointmentId ? (
          <Text style={styles.mutedSmall}>Appointment ID: {appointmentId}</Text>
        ) : null}
        {step === "payment_pending" ? (
          <Text style={styles.body}>{pendingMessage}</Text>
        ) : (
          <Text style={styles.body}>We sent a confirmation to your email. See you at the salon.</Text>
        )}
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/(app)/client")}>
          <Text style={styles.primaryBtnText}>Back to Discover</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const unavailableMsg =
    availability?.reason === "DAY_OFF"
      ? "Closed on this day — pick another date."
      : availability?.reason === "FULLY_BOOKED"
        ? "Fully booked — try another date."
        : "No available times for this selection.";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {pIdx >= 0 ? `Step ${pIdx + 1} of ${orderedSteps.length}` : ""}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        {step === "service" && (
          <View>
            <Text style={styles.h1}>Choose a service</Text>
            <Text style={styles.lead}>At {storefront.name}</Text>
            {categoriesFromStorefront(storefront).map((cat) => (
              <View key={cat} style={styles.block}>
                <Text style={styles.catLabel}>{cat}</Text>
                {storefront.services
                  .filter((s) => s.category === cat)
                  .map((s) => (
                    <Pressable
                      key={s.id}
                      style={[styles.rowCard, serviceId === s.id && styles.rowCardOn]}
                      onPress={() => {
                        setServiceId(s.id);
                        setStaffId(null);
                        setSelectedTime(null);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: serviceId === s.id }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{s.name}</Text>
                        <Text style={styles.rowMeta}>{s.duration}</Text>
                      </View>
                      <Text style={styles.price}>{formatMoney(s.price, storefront.currencyCode)}</Text>
                    </Pressable>
                  ))}
              </View>
            ))}
          </View>
        )}

        {step === "specialist" && selectedService && (
          <View>
            <Text style={styles.h1}>Specialist</Text>
            <Text style={styles.lead}>Who should perform {selectedService.name}?</Text>
            <Pressable
              style={[styles.rowCard, staffId === null && styles.rowCardOn]}
              onPress={() => setStaffId(null)}
              accessibilityRole="button"
            >
              <Text style={styles.rowTitle}>Any available</Text>
              <Text style={styles.rowMeta}>Earliest slot</Text>
            </Pressable>
            {staffForService(storefront, selectedService.id).map((t) => (
              <Pressable
                key={t.id}
                style={[styles.rowCard, staffId === t.id && styles.rowCardOn]}
                onPress={() => setStaffId(t.id)}
                accessibilityRole="button"
              >
                <SafeImage
                  uri={t.avatar}
                  style={styles.avatar}
                  fallbackLetter={t.name}
                  accessibilityLabel={t.name}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{t.name}</Text>
                  <Text style={styles.rowMeta}>{t.role}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {step === "datetime" && selectedService && (
          <View>
            <Text style={styles.h1}>Date & time</Text>
            <Text style={styles.lead}>Pick a day, then a slot.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip}>
              {dayStrip.map((d) => {
                const iso = toLocalDateString(d);
                const sel = selectedDate && toLocalDateString(selectedDate) === iso;
                return (
                  <Pressable
                    key={iso}
                    style={[styles.dateChip, sel && styles.dateChipOn]}
                    onPress={() => {
                      setSelectedDate(d);
                      setSelectedTime(null);
                      clearAlternatives();
                    }}
                  >
                    <Text style={[styles.dateChipDow, sel && styles.dateChipTxtOn]}>
                      {formatShortWeekday(d)}
                    </Text>
                    <Text style={[styles.dateChipDm, sel && styles.dateChipTxtOn]}>
                      {formatDayMonth(d)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {!selectedDate ? (
              <Text style={styles.muted}>Select a date above.</Text>
            ) : availLoading ? (
              <ActivityIndicator style={{ marginTop: 16 }} />
            ) : !availability?.isAvailable || availability.slots.length === 0 ? (
              <View style={styles.emptySlots}>
                <Text style={styles.muted}>{unavailableMsg}</Text>
              </View>
            ) : (
              <View style={styles.slotGrid}>
                {availability.slots.map((slot) => {
                  const available = slot.staff.length > 0;
                  return (
                    <Pressable
                      key={slot.time}
                      disabled={!available}
                      style={[
                        styles.slotBtn,
                        selectedTime === slot.time && styles.slotBtnOn,
                        !available && styles.slotBtnOff,
                      ]}
                      onPress={() => {
                        if (!available) return;
                        setSelectedTime(slot.time);
                        clearAlternatives();
                      }}
                    >
                      <Text style={[styles.slotTxt, selectedTime === slot.time && styles.slotTxtOn]}>
                        {slot.time}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {alternatives.length > 0 ? (
              <View style={styles.altBox}>
                <Text style={styles.altTitle}>Nearby times</Text>
                {alternatives.map((t) => (
                  <Text key={t} style={styles.altItem}>
                    {t}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {step === "details" && (
          <View>
            <Text style={styles.h1}>Your details</Text>
            <Text style={styles.label}>Full name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Jane Doe" />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+33… (required)"
            />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput style={[styles.input, styles.notes]} value={notes} onChangeText={setNotes} multiline />
            <View style={styles.gdprRow}>
              <Switch value={gdprConsent} onValueChange={setGdprConsent} accessibilityLabel="GDPR consent" />
              <Text style={styles.gdprText}>I agree to the processing of my data for this booking (required).</Text>
            </View>
          </View>
        )}

        {step === "review" && selectedService && (
          <View>
            <Text style={styles.h1}>Review</Text>
            <View style={styles.summary}>
              <Text style={styles.sumRow}>
                <Text style={styles.sumLabel}>Salon</Text> {storefront.name}
              </Text>
              <Text style={styles.sumRow}>
                <Text style={styles.sumLabel}>Service</Text> {selectedService.name}
              </Text>
              <Text style={styles.sumRow}>
                <Text style={styles.sumLabel}>When</Text>{" "}
                {selectedDate?.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                at {selectedTime}
              </Text>
              <Text style={styles.sumRow}>
                <Text style={styles.sumLabel}>Total</Text>{" "}
                {formatMoney(selectedService.price, storefront.currencyCode)}
              </Text>
            </View>
            <Text style={styles.subh}>Payment</Text>
            {(["later", "deposit", "full"] as const).map((m) => (
              <Pressable
                key={m}
                style={[styles.rowCard, paymentMethod === m && styles.rowCardOn]}
                onPress={() => {
                  setPaymentMethod(m);
                  if (m === "later") setPaymentChannel("card");
                }}
              >
                <Text style={styles.rowTitle}>
                  {m === "later" ? "Pay at salon" : m === "deposit" ? "Deposit now" : "Pay in full now"}
                </Text>
                <Text style={styles.rowMeta}>
                  {m === "later"
                    ? "No online payment in the app"
                    : m === "deposit"
                      ? `Pay ${DEPOSIT_PERCENT}% now — remainder at the visit`
                      : "Pay the full service price now"}
                </Text>
              </Pressable>
            ))}
            {(paymentMethod === "deposit" || paymentMethod === "full") && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.subh}>How to pay</Text>
                <Pressable
                  style={[styles.rowCard, paymentChannel === "card" && styles.rowCardOn]}
                  onPress={() => setPaymentChannel("card")}
                >
                  <Text style={styles.rowTitle}>Card (Stripe)</Text>
                  <Text style={styles.rowMeta}>Pay in the app with your card</Text>
                </Pressable>
                <Pressable
                  style={[styles.rowCard, paymentChannel === "mobile_money" && styles.rowCardOn]}
                  onPress={() => setPaymentChannel("mobile_money")}
                >
                  <Text style={styles.rowTitle}>Mobile money</Text>
                  <Text style={styles.rowMeta}>PawaPay — approve the push on your phone</Text>
                </Pressable>
              </View>
            )}
            {submitError ? <Text style={styles.errInline}>{submitError}</Text> : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.secondaryBtn} onPress={goBack}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </Pressable>
        {step === "review" ? (
          <Pressable
            style={[styles.primaryBtn, (submitting || !canContinue) && styles.disabled]}
            disabled={submitting || !canContinue}
            onPress={() => void handleConfirm()}
          >
            <Text style={styles.primaryBtnText}>{submitting ? "Booking…" : "Confirm booking"}</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryBtn, !canContinue && styles.disabled]}
            disabled={!canContinue}
            onPress={goNext}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 10 },
  muted: { color: "#666", textAlign: "center" },
  mutedSmall: { color: "#888", fontSize: 12, marginTop: 8 },
  errTitle: { fontSize: 18, fontWeight: "600" },
  progress: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#eee" },
  progressText: { fontSize: 12, color: "#888", fontWeight: "600" },
  pad: { padding: 16, paddingBottom: 120 },
  h1: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  lead: { fontSize: 14, color: "#666", marginBottom: 16 },
  block: { marginBottom: 20 },
  catLabel: { fontSize: 11, fontWeight: "700", color: "#888", letterSpacing: 1, marginBottom: 8 },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0dcd8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  rowCardOn: { borderColor: "#6b5344", backgroundColor: "#faf6f2" },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  rowMeta: { fontSize: 12, color: "#777", marginTop: 2 },
  price: { fontSize: 15, fontWeight: "700", color: "#6b5344" },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  dateStrip: { marginVertical: 12, maxHeight: 88 },
  dateChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    minWidth: 72,
  },
  dateChipOn: { borderColor: "#6b5344", backgroundColor: "#6b5344" },
  dateChipDow: { fontSize: 11, color: "#888", fontWeight: "600" },
  dateChipDm: { fontSize: 15, fontWeight: "700", color: "#111", marginTop: 2 },
  dateChipTxtOn: { color: "#fff" },
  emptySlots: { paddingVertical: 24, alignItems: "center" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  slotBtn: {
    width: "31%",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    marginBottom: 8,
  },
  slotBtnOn: { backgroundColor: "#6b5344", borderColor: "#6b5344" },
  slotBtnOff: { opacity: 0.35 },
  slotTxt: { fontSize: 14, fontWeight: "600", color: "#222" },
  slotTxtOn: { color: "#fff" },
  altBox: { marginTop: 16, padding: 12, backgroundColor: "#fff8e6", borderRadius: 10 },
  altTitle: { fontWeight: "700", marginBottom: 6, color: "#7a5c00" },
  altItem: { fontSize: 13, color: "#555" },
  label: { fontSize: 12, fontWeight: "600", color: "#555", marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  notes: { minHeight: 80, textAlignVertical: "top" },
  gdprRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  gdprText: { flex: 1, fontSize: 13, color: "#444" },
  subh: { fontSize: 16, fontWeight: "700", marginTop: 20, marginBottom: 10 },
  summary: { gap: 8, marginBottom: 8 },
  sumRow: { fontSize: 14, color: "#333" },
  sumLabel: { color: "#888", fontWeight: "600", marginRight: 8 },
  errInline: { color: "#b00020", marginTop: 12 },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#6b5344",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
  },
  secondaryBtnText: { fontWeight: "600", color: "#333" },
  disabled: { opacity: 0.45 },
  confirmPad: { padding: 24, gap: 12 },
  successTitle: { fontSize: 24, fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 22, color: "#444" },
  outlineBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  outlineBtnText: { fontWeight: "600", color: "#444" },
  bold: { fontWeight: "700", color: "#111" },
});
