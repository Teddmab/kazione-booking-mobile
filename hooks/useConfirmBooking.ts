import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

import { useCreateBooking } from '@/hooks/useCreateBooking';
import { useBookingActions, useBookingDraft } from '@/hooks/useBookingStore';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingDraft } from '@/store/bookingStore';
import { paymentOptionToApiMethod } from '@/types/bookingDraft';
import type { CreateBookingParams } from '@/types/booking';

function buildPayload(draft: BookingDraft): CreateBookingParams {
  return {
    business_id: draft.businessId,
    service_id: draft.serviceId,
    staff_profile_id: draft.staffId,
    date: draft.date!,
    time: draft.timeSlot!,
    client: {
      name: draft.clientName.trim(),
      email: draft.clientEmail.trim(),
      phone: draft.clientPhone.trim(),
    },
    payment_method: paymentOptionToApiMethod(draft.paymentOption),
    gdpr_consent: draft.gdprConsent,
    locale: 'en',
  };
}

export function useConfirmBooking() {
  const router = useRouter();
  const draft = useBookingDraft();
  const { setLastConfirmation, reset } = useBookingActions();
  const { session } = useAuth();
  const { mutateAsync, isPending, error, alternatives } = useCreateBooking();

  const confirm = useCallback(async () => {
    const payload = buildPayload(draft);
    const result = await mutateAsync(payload);
    const paymentOption = draft.paymentOption;

    setLastConfirmation({
      reference: result.booking_reference,
      appointmentId: result.appointment_id,
      serviceName: draft.serviceName,
      date: draft.date!,
      timeSlot: draft.timeSlot!,
      staffName: draft.staffName,
      paymentOption,
      clientEmail: draft.clientEmail,
      salonName: draft.salonName,
      salonCity: draft.salonCity,
      serviceDuration: draft.serviceDuration,
      isGuest: !session,
    });
    reset();

    if (paymentOption === 'at_salon') {
      router.replace({
        pathname: '/booking/confirmation',
        params: {
          reference: result.booking_reference,
          bookingId: result.appointment_id,
        },
      } as Href);
      return;
    }

    router.push({
      pathname: '/payment/processing',
      params: {
        reference: result.booking_reference,
        appointmentId: result.appointment_id,
        paymentOption,
      },
    } as Href);
  }, [draft, mutateAsync, reset, router, session, setLastConfirmation]);

  return {
    confirm,
    isPending,
    error: error instanceof Error ? error.message : null,
    alternatives,
  };
}
