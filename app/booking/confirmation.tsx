import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { useBookingStore } from '@/store/bookingStore';
import { formatBookingDateLong } from '@/lib/bookingFormat';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reference?: string; bookingId?: string }>();
  const last = useBookingStore((s) => s.lastConfirmation);

  const reference = params.reference ?? last?.reference ?? '—';
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const copyRef = async () => {
    await Share.share({ message: String(reference) });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.lg }]}>
      <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
        <Ionicons name="checkmark" size={60} color="#fff" />
      </Animated.View>

      <Text style={styles.title}>{t('booking.confirmedTitle', 'Booking Confirmed!')}</Text>

      <Pressable style={styles.refChip} onPress={() => void copyRef()}>
        <Text style={styles.refText}>#{reference}</Text>
        <Text style={styles.refHint}>{t('booking.tapCopy', 'Tap to copy')}</Text>
      </Pressable>

      {last ? (
        <View style={styles.summary}>
          <Text style={styles.line}>{last.serviceName}</Text>
          <Text style={styles.lineMuted}>
            {formatBookingDateLong(last.date)} · {last.timeSlot}
          </Text>
          <Text style={styles.lineMuted}>
            {last.staffName ?? t('booking.noPreference', 'Best Available')}
          </Text>
          <Text style={styles.lineMuted}>{last.salonName}</Text>
        </View>
      ) : null}

      {last?.isGuest ? (
        <View style={styles.guestBanner}>
          <Text style={styles.guestText}>
            {t('booking.emailSent', 'A confirmation email has been sent to {{email}}', {
              email: last.clientEmail,
            })}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/signup' as Href)}>
            <Text style={styles.guestCta}>
              {t('booking.createAccount', 'Create an account to track your bookings')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={t('bookings.title', 'View My Bookings')}
          onPress={() => router.replace('/(tabs)/bookings' as Href)}
        />
        <Button
          variant="secondary"
          label={t('booking.backHome', 'Back to Home')}
          onPress={() => router.replace('/(tabs)' as Href)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: { ...TYPOGRAPHY.display, color: COLORS.text, textAlign: 'center', marginBottom: SPACING.md },
  refChip: {
    backgroundColor: COLORS.elevated,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  refText: { ...TYPOGRAPHY.h2, color: COLORS.orange },
  refHint: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  summary: {
    alignSelf: 'stretch',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: 12,
    padding: SPACING.md,
  },
  line: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '600' },
  lineMuted: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 4 },
  guestBanner: {
    backgroundColor: COLORS.elevated,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    alignSelf: 'stretch',
  },
  guestText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  guestCta: { ...TYPOGRAPHY.caption, color: COLORS.orange, marginTop: SPACING.sm, fontWeight: '600' },
  actions: { alignSelf: 'stretch', gap: SPACING.sm, width: '100%' },
});
