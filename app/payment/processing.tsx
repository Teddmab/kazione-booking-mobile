import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ownerColors } from '@/constants/ownerTheme';

export default function PaymentProcessingScreen() {
  const { reference, appointmentId, paymentOption } = useLocalSearchParams<{
    reference: string;
    appointmentId: string;
    paymentOption: string;
  }>();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    if (!reference || !appointmentId) {
      router.replace('/payment/failure' as Href);
      return;
    }

    if (paymentOption === 'deposit' || paymentOption === 'full') {
      // For mobile-money (PawaPay) the backend initiates the charge and
      // the user is redirected back via the deep-link [callback] route.
      // Show spinner — do nothing here; the callback will drive the next step.
      return;
    }

    // Fallback: treat as confirmed (e.g. card pre-auth already captured)
    router.replace({
      pathname: '/booking/confirmation',
      params: { reference, bookingId: appointmentId },
    } as Href);
  }, [reference, appointmentId, paymentOption, router]);

  return (
    <View style={styles.container}>
      <LoadingSpinner />
      <Text style={styles.label}>{t('booking.processingPayment')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    backgroundColor: ownerColors.bg,
  },
  label: {
    fontSize: 15,
    color: ownerColors.textMuted,
    fontWeight: '500',
  },
});
