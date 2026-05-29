import { create } from 'zustand';

import type { PaymentOption } from '@/types/bookingDraft';

export interface BookingDraft {
  salonSlug: string;
  businessId: string;
  salonName: string;
  salonCity: string | null;
  currencyCode: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffId: string | null;
  staffName: string | null;
  date: string | null;
  timeSlot: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  gdprConsent: boolean;
  paymentOption: PaymentOption;
}

const initialDraft: BookingDraft = {
  salonSlug: '',
  businessId: '',
  salonName: '',
  salonCity: null,
  currencyCode: 'EUR',
  serviceId: '',
  serviceName: '',
  servicePrice: 0,
  serviceDuration: 0,
  staffId: null,
  staffName: null,
  date: null,
  timeSlot: null,
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  gdprConsent: false,
  paymentOption: 'full',
};

interface BookingStore {
  draft: BookingDraft;
  /** Snapshot for confirmation after reset */
  lastConfirmation: {
    reference: string;
    appointmentId: string;
    serviceName: string;
    date: string;
    timeSlot: string;
    staffName: string | null;
    paymentOption: PaymentOption;
    clientEmail: string;
    salonName: string;
    salonCity: string | null;
    serviceDuration: number;
    isGuest: boolean;
  } | null;
  setSalon: (
    salonSlug: string,
    businessId: string,
    salonName: string,
    salonCity: string | null,
    currencyCode: string,
  ) => void;
  setService: (
    serviceId: string,
    serviceName: string,
    servicePrice: number,
    serviceDuration: number,
  ) => void;
  setStaff: (staffId: string | null, staffName: string | null) => void;
  setDateTime: (date: string, timeSlot: string) => void;
  setClientDetails: (name: string, email: string, phone: string) => void;
  setGdprConsent: (value: boolean) => void;
  setPaymentOption: (option: PaymentOption) => void;
  setLastConfirmation: (data: NonNullable<BookingStore['lastConfirmation']>) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  draft: { ...initialDraft },
  lastConfirmation: null,
  setSalon: (salonSlug, businessId, salonName, salonCity, currencyCode) =>
    set((s) => ({
      draft: { ...s.draft, salonSlug, businessId, salonName, salonCity, currencyCode },
    })),
  setService: (serviceId, serviceName, servicePrice, serviceDuration) =>
    set((s) => ({
      draft: { ...s.draft, serviceId, serviceName, servicePrice, serviceDuration },
    })),
  setStaff: (staffId, staffName) =>
    set((s) => ({
      draft: { ...s.draft, staffId, staffName },
    })),
  setDateTime: (date, timeSlot) =>
    set((s) => ({
      draft: { ...s.draft, date, timeSlot },
    })),
  setClientDetails: (clientName, clientEmail, clientPhone) =>
    set((s) => ({
      draft: { ...s.draft, clientName, clientEmail, clientPhone },
    })),
  setGdprConsent: (gdprConsent) =>
    set((s) => ({
      draft: { ...s.draft, gdprConsent },
    })),
  setPaymentOption: (paymentOption) =>
    set((s) => ({
      draft: { ...s.draft, paymentOption },
    })),
  setLastConfirmation: (lastConfirmation) => set({ lastConfirmation }),
  reset: () => set({ draft: { ...initialDraft }, lastConfirmation: null }),
}));
