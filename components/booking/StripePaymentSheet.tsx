import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

function urlScheme(): string {
  const s = Constants.expoConfig?.scheme;
  return typeof s === "string" && s.length > 0 ? s : "kazionebookingmobile";
}

type InnerProps = {
  clientSecret: string;
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  amountLabel: string;
  onPaid: () => void;
  onUserCancel: () => void;
};

function StripePaymentSheetInner({
  clientSecret,
  billingName,
  billingEmail,
  billingPhone,
  amountLabel,
  onPaid,
  onUserCancel,
}: InnerProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [sheetReady, setSheetReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const cbRef = useRef({ onPaid, onUserCancel });
  cbRef.current = { onPaid, onUserCancel };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { error } = await initPaymentSheet({
        merchantDisplayName: "Kazione",
        paymentIntentClientSecret: clientSecret,
        returnURL: Linking.createURL("stripe-redirect"),
        defaultBillingDetails: {
          name: billingName,
          email: billingEmail,
          phone: billingPhone,
        },
        allowsDelayedPaymentMethods: true,
      });
      if (cancelled) return;
      if (error) {
        setInitError(error.message);
        return;
      }
      setSheetReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [billingEmail, billingName, billingPhone, clientSecret, initPaymentSheet]);

  const handlePay = useCallback(async () => {
    if (!sheetReady) return;
    setPaying(true);
    setPayError(null);
    const { error } = await presentPaymentSheet();
    setPaying(false);
    if (error) {
      if (error.code === "Canceled") {
        cbRef.current.onUserCancel();
      } else {
        setPayError(error.message ?? "Payment failed");
      }
      return;
    }
    cbRef.current.onPaid();
  }, [presentPaymentSheet, sheetReady]);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Card payment</Text>
      <Text style={styles.amount}>{amountLabel}</Text>
      {initError ? <Text style={styles.err}>{initError}</Text> : null}
      {payError ? <Text style={styles.err}>{payError}</Text> : null}
      {!sheetReady && !initError ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : null}
      <Pressable
        style={[styles.primary, (!sheetReady || paying) && styles.disabled]}
        disabled={!sheetReady || paying}
        onPress={() => void handlePay()}
      >
        <Text style={styles.primaryTxt}>{paying ? "Opening…" : "Pay with card"}</Text>
      </Pressable>
      {initError ? (
        <Pressable style={styles.secondary} onPress={onUserCancel}>
          <Text style={styles.secondaryTxt}>Close</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export type StripePaymentSheetProps = InnerProps & {
  stripeAccountId?: string | null;
};

/**
 * Nested provider so Connect `stripeAccountId` matches the PaymentIntent without wrapping the whole app.
 */
export function StripePaymentSheet({
  stripeAccountId,
  ...inner
}: StripePaymentSheetProps) {
  if (!PUBLISHABLE_KEY.trim()) {
    return (
      <View style={styles.box}>
        <Text style={styles.err}>Stripe is not configured (missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY).</Text>
      </View>
    );
  }

  return (
    <StripeProvider
      publishableKey={PUBLISHABLE_KEY.trim()}
      urlScheme={urlScheme()}
      stripeAccountId={stripeAccountId?.trim() || undefined}
    >
      <StripePaymentSheetInner {...inner} />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  box: { padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  amount: { fontSize: 18, fontWeight: "600", color: "#6b5344" },
  err: { color: "#b00020", fontSize: 14 },
  primary: {
    marginTop: 16,
    backgroundColor: "#6b5344",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.45 },
  secondary: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryTxt: { fontWeight: "600", color: "#555" },
});
