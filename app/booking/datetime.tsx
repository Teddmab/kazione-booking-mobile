import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BookingStepShell } from '@/components/booking/BookingStepShell';
import { MonthCalendar } from '@/components/booking/MonthCalendar';
import { TimeSlotGrid } from '@/components/booking/TimeSlotGrid';
import { useAvailability } from '@/hooks/useAvailability';
import { useBookingActions, useBookingDraft } from '@/hooks/useBookingStore';
import { availabilityToDisplaySlots } from '@/lib/bookingSlots';
import { formatBookingDateLong } from '@/lib/bookingFormat';
import { paymentOptionToApiMethod } from '@/types/bookingDraft';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import { startOfToday } from '@/lib/dateUtils';

export default function BookingDatetimeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const draft = useBookingDraft();
  const { setDateTime, setPaymentOption } = useBookingActions();

  const [month, setMonth] = useState(() => {
    const d = startOfToday();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(draft.date);
  const [selectedTime, setSelectedTime] = useState<string | null>(draft.timeSlot);

  const paymentMethod = paymentOptionToApiMethod(draft.paymentOption);

  const { data: availability, isLoading: slotsLoading } = useAvailability({
    business_id: draft.businessId,
    service_id: draft.serviceId,
    date: selectedDate ?? undefined,
    staff_id: draft.staffId ?? undefined,
    payment_method: paymentMethod,
  });

  const displaySlots = useMemo(
    () => availabilityToDisplaySlots(availability, draft.staffId),
    [availability, draft.staffId],
  );

  const continueNext = () => {
    if (!selectedDate || !selectedTime) return;
    setDateTime(selectedDate, selectedTime);
    router.push('/booking/details' as Href);
  };

  return (
    <BookingStepShell
      title="Choose Date & Time"
      step={2}
      onBack={() => router.back()}
      continueDisabled={!selectedDate || !selectedTime}
      onContinue={continueNext}>
      <MonthCalendar
        month={month}
        selectedDate={selectedDate}
        onSelectDate={(iso) => {
          setSelectedDate(iso);
          setSelectedTime(null);
        }}
        onPrevMonth={() =>
          setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
        }
        onNextMonth={() =>
          setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
        }
      />

      {selectedDate ? (
        <>
          <Text style={styles.section}>{t('booking.availableTimes', 'Available Times')}</Text>
          <TimeSlotGrid
            slots={displaySlots}
            selectedTime={selectedTime}
            isLoading={slotsLoading}
            emptyMessage={t(
              'booking.noAvailability',
              'No availability for this date — please select another day',
            )}
            onSelect={(time, isReservable) => {
              setSelectedTime(time);
              if (isReservable) setPaymentOption('deposit');
            }}
          />
        </>
      ) : (
        <Text style={styles.hint}>{t('booking.pickDate', 'Select a date above')}</Text>
      )}

      {selectedDate && selectedTime ? (
        <Text style={styles.summary}>
          {t('booking.selected', 'Selected')}: {formatBookingDateLong(selectedDate)} · {selectedTime}
        </Text>
      ) : null}
    </BookingStepShell>
  );
}

const styles = StyleSheet.create({
  section: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.sm },
  hint: { ...TYPOGRAPHY.body, color: COLORS.textMuted },
  summary: { ...TYPOGRAPHY.body, color: COLORS.orange, marginTop: SPACING.md },
});
