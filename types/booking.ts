export type PaymentMethod = "deposit" | "full" | "later";

export interface AvailabilityParams {
  business_id: string;
  service_id: string;
  date: string;
  staff_id?: string;
  payment_method?: PaymentMethod;
}

export interface StaffSlot {
  id: string;
  name: string;
  avatarUrl: string | null;
  price: number;
}

export interface Slot {
  time: string;
  staff: StaffSlot[];
}

export interface ServiceInfo {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export type UnavailableReason =
  | "DATE_IN_PAST"
  | "OUTSIDE_BOOKING_WINDOW"
  | "DAY_OFF"
  | "FULLY_BOOKED";

export interface AvailabilityResult {
  date: string;
  dayName: string;
  service: ServiceInfo | null;
  slots: Slot[];
  reserved_slots?: string[];
  isAvailable: boolean;
  reason?: UnavailableReason;
}

export interface CreateBookingClient {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface CreateBookingParams {
  business_id: string;
  service_id: string;
  staff_profile_id: string | null;
  date: string;
  time: string;
  client: CreateBookingClient;
  payment_method: PaymentMethod;
  gdpr_consent?: boolean;
  locale?: "en" | "et" | "fr";
}

export interface CreateBookingResult {
  booking_reference: string;
  appointment_id: string;
  cancel_token?: string;
  status: "confirmed" | "pending_payment";
  payment_intent_client_secret?: string;
  stripe_account_id?: string;
  stripe_key_hint?: string | null;
}
