import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * Deep link: kazione://payment/pawapay?status=success&payment_id=...
 */
export default function PaymentCallbackScreen() {
  const { status, payment_id: paymentId } = useLocalSearchParams<{
    status?: string;
    payment_id?: string;
  }>();
  const router = useRouter();

  useEffect(() => {
    if (status === 'success') {
      router.replace(
        (paymentId
          ? `/payment/success?paymentId=${paymentId}`
          : '/payment/success') as Href,
      );
      return;
    }
    router.replace('/payment/failure' as Href);
  }, [status, paymentId, router]);

  return (
    <View style={{ flex: 1 }}>
      <LoadingSpinner />
    </View>
  );
}
