import { useBookingStore } from '@/store/bookingStore';
import { isBookingReadyForPayment } from '@/hooks/useBookingStore';

describe('bookingStore', () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
  });

  it('starts with empty draft', () => {
    const { draft } = useBookingStore.getState();
    expect(draft.serviceId).toBe('');
    expect(draft.staffId).toBeNull();
    expect(draft.date).toBeNull();
    expect(draft.gdprConsent).toBe(false);
    expect(draft.paymentOption).toBe('full');
  });

  it('setService updates service fields', () => {
    useBookingStore.getState().setService('svc-1', 'Braids', 80, 90);
    expect(useBookingStore.getState().draft.serviceId).toBe('svc-1');
    expect(useBookingStore.getState().draft.servicePrice).toBe(80);
  });

  it('setStaff allows null no-preference', () => {
    useBookingStore.getState().setStaff(null, null);
    expect(useBookingStore.getState().draft.staffId).toBeNull();
  });

  it('setDateTime sets date and time', () => {
    useBookingStore.getState().setDateTime('2026-05-22', '10:00');
    expect(useBookingStore.getState().draft.date).toBe('2026-05-22');
    expect(useBookingStore.getState().draft.timeSlot).toBe('10:00');
  });

  it('setClientDetails and gdpr', () => {
    useBookingStore.getState().setClientDetails('Jane', 'j@t.com', '+372555');
    useBookingStore.getState().setGdprConsent(true);
    const { draft } = useBookingStore.getState();
    expect(draft.clientName).toBe('Jane');
    expect(draft.gdprConsent).toBe(true);
  });

  it('reset clears draft', () => {
    useBookingStore.getState().setService('a', 'b', 1, 60);
    useBookingStore.getState().reset();
    expect(useBookingStore.getState().draft.serviceId).toBe('');
  });

  it('isBookingReadyForPayment when complete', () => {
    const s = useBookingStore.getState();
    s.setSalon('afrotouch', 'biz', 'Salon', 'Tallinn', 'EUR');
    s.setService('svc', 'Cut', 50, 60);
    s.setDateTime('2026-05-22', '11:00');
    s.setClientDetails('Jane Doe', 'j@example.com', '+37251234567');
    s.setGdprConsent(true);
    expect(isBookingReadyForPayment(useBookingStore.getState().draft)).toBe(true);
  });
});
