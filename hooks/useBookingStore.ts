import { useBookingStore } from '@/store/bookingStore';
import type { BookingDraft } from '@/store/bookingStore';

export function useBookingDraft(): BookingDraft {
  return useBookingStore((s) => s.draft);
}

export function useBookingActions() {
  return useBookingStore((s) => ({
    setSalon: s.setSalon,
    setService: s.setService,
    setStaff: s.setStaff,
    setDateTime: s.setDateTime,
    setClientDetails: s.setClientDetails,
    setGdprConsent: s.setGdprConsent,
    setPaymentOption: s.setPaymentOption,
    setLastConfirmation: s.setLastConfirmation,
    reset: s.reset,
  }));
}

export function isBookingReadyForPayment(draft: BookingDraft): boolean {
  return (
    !!draft.businessId &&
    !!draft.serviceId &&
    !!draft.date &&
    !!draft.timeSlot &&
    draft.clientName.trim().length >= 2 &&
    draft.clientEmail.includes('@') &&
    draft.clientPhone.trim().length >= 6 &&
    draft.gdprConsent === true
  );
}

export function isStaffStepComplete(draft: BookingDraft): boolean {
  return draft.staffId !== undefined;
}
