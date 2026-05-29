import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BookingStepShell } from '@/components/booking/BookingStepShell';
import { Card } from '@/components/ui/Card';
import { useConfirmBooking } from '@/hooks/useConfirmBooking';
import { useBookingActions, useBookingDraft } from '@/hooks/useBookingStore';
import { depositAmount, formatBookingDateLong, formatMoney } from '@/lib/bookingFormat';
import type { PaymentOption } from '@/types/bookingDraft';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';

function PaymentOptionCard({
  option,
  label,
  sub,
  selected,
  onSelect,
}: {
  option: PaymentOption;
  label: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      style={[styles.payCard, selected && styles.payCardOn]}
      onPress={onSelect}>
      <Text style={styles.payLabel}>{label}</Text>
      <Text style={styles.paySub}>{sub}</Text>
    </Pressable>
  );
}

export default function BookingSummaryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const draft = useBookingDraft();
  const { setPaymentOption } = useBookingActions();
  const { confirm, isPending, error, alternatives } = useConfirmBooking();

  const deposit = depositAmount(draft.servicePrice, 30);
  const remaining = draft.servicePrice - deposit;

  const confirmLabel = useMemo(() => {
    if (draft.paymentOption === 'at_salon') return t('booking.confirmAtSalon', 'Confirm Booking');
    if (draft.paymentOption === 'deposit') {
      return t('booking.payDepositNow', 'Pay {{amount}} Now', {
        amount: formatMoney(deposit, draft.currencyCode),
      });
    }
    return t('booking.payFullNow', 'Pay {{amount}} Now', {
      amount: formatMoney(draft.servicePrice, draft.currencyCode),
    });
  }, [draft.paymentOption, draft.servicePrice, draft.currencyCode, deposit, t]);

  return (
    <BookingStepShell
      title="Booking Summary"
      step={4}
      onBack={() => router.back()}
      continueLabel={confirmLabel}
      continueLoading={isPending}
      onContinue={() => void confirm()}>
      <Card style={styles.card}>
        <Text style={styles.serviceName}>{draft.serviceName}</Text>
        <Text style={styles.badge}>{draft.serviceDuration} min</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t('booking.stylist', 'Stylist')}</Text>
          <Pressable onPress={() => router.push('/booking/staff' as Href)}>
            <Text style={styles.edit}>
              {draft.staffName ?? t('booking.noPreference', 'Best Available')} · Edit
            </Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('booking.dateTime', 'When')}</Text>
          <Pressable onPress={() => router.push('/booking/datetime' as Href)}>
            <Text style={styles.edit}>
              {draft.date ? formatBookingDateLong(draft.date) : '—'} · {draft.timeSlot} · Edit
            </Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('booking.price', 'Price')}</Text>
          <Text style={styles.price}>
            {formatMoney(draft.servicePrice, draft.currencyCode)}
          </Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>{t('payment.title', 'Payment Method')}</Text>
      <PaymentOptionCard
        option="full"
        label={t('payment.fullPayment', 'Full Payment') + ` (${formatMoney(draft.servicePrice, draft.currencyCode)})`}
        sub={t('payment.fullSub', 'Pay now by card or mobile money')}
        selected={draft.paymentOption === 'full'}
        onSelect={() => setPaymentOption('full')}
      />
      <PaymentOptionCard
        option="deposit"
        label={t('payment.deposit', '30% Deposit') + ` (${formatMoney(deposit, draft.currencyCode)})`}
        sub={t('payment.depositSub', 'Pay {{dep}} now · {{rest}} at salon', {
          dep: formatMoney(deposit, draft.currencyCode),
          rest: formatMoney(remaining, draft.currencyCode),
        })}
        selected={draft.paymentOption === 'deposit'}
        onSelect={() => setPaymentOption('deposit')}
      />
      <PaymentOptionCard
        option="at_salon"
        label={t('payment.payAtSalon', 'Pay at Salon')}
        sub={t('payment.payAtSalonSub', 'Reserve now, pay on the day')}
        selected={draft.paymentOption === 'at_salon'}
        onSelect={() => setPaymentOption('at_salon')}
      />

      <Text style={styles.terms}>
        {t('booking.cancellationNote', 'By confirming you agree to the cancellation policy.')}
      </Text>

      {error ? <Text style={styles.err}>{error}</Text> : null}
      {alternatives.length > 0 ? (
        <Text style={styles.alt}>
          {t('booking.tryTimes', 'Try:')} {alternatives.join(', ')}
        </Text>
      ) : null}
    </BookingStepShell>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.lg },
  serviceName: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.elevated,
    color: COLORS.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.md,
  },
  row: { marginBottom: SPACING.sm },
  label: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  edit: { ...TYPOGRAPHY.body, color: COLORS.text },
  price: { ...TYPOGRAPHY.h2, color: COLORS.orange, textAlign: 'right' },
  sectionTitle: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.sm },
  payCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  payCardOn: { borderColor: COLORS.orange, borderLeftWidth: 4 },
  payLabel: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '600' },
  paySub: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 4 },
  terms: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: SPACING.md },
  err: { ...TYPOGRAPHY.caption, color: COLORS.error, marginTop: SPACING.sm },
  alt: { ...TYPOGRAPHY.caption, color: COLORS.orange, marginTop: SPACING.xs },
});
