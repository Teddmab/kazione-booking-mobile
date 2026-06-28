export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface AppointmentFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: AppointmentStatus[];
  staffId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAppointments {
  appointments: AppointmentWithRelations[];
  total: number;
}

export interface AppointmentWithRelations {
  id: string;
  business_id: string;
  client_id: string;
  staff_profile_id: string | null;
  service_id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  booking_reference: string;
  notes?: string | null;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  };
  staff: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  commission_earned?: number | null;
  payment: {
    status: string;
    amount: number;
    method: string;
    paid_at: string | null;
  } | null;
}

export interface UpcomingAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  booking_reference: string;
  client_name: string;
  service_name: string;
  staff_name: string;
  price: number;
}

export interface PeriodStats {
  total: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

export interface DashboardKPIs {
  today: PeriodStats & { remaining: number; walk_ins: number };
  this_week: PeriodStats;
  this_month: Omit<PeriodStats, "cancelled">;
  active_clients_total: number;
  avg_rating: number;
  completion_rate_30d: number;
  upcoming_today: UpcomingAppointment[];
  staff_on_today: { staff_profile_id: string; display_name: string }[];
}

export interface ClientDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

export interface ClientWithStats extends ClientDetail {
  appointment_count: number;
  last_visit: string | null;
  total_spent: number;
}

export interface ClientFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedClients {
  clients: ClientWithStats[];
  total: number;
}

/** Aggregated counts from GET /clients?action=stats */
export interface ClientStats {
  total: number;
  new: number;
  active: number;
  vip: number;
  at_risk: number;
  inactive: number;
}

export type StaffCommissionType = "none" | "percentage" | "fixed";

export interface OwnerServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes?: number;
  price: number;
  deposit_amount?: number | null;
  currency_code: string;
  is_active: boolean;
  category_name: string | null;
  image_url?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  staff_commission_type?: StaffCommissionType;
  staff_commission_value?: number | null;
}

export interface StaffWorkingDay {
  day: number;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface StaffMember {
  id: string;
  display_name: string;
  position?: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  avatar_url: string | null;
  working_hours?: StaffWorkingDay[];
  invited_at?: string | null;
  invited_email?: string | null;
  is_pending_invite?: boolean;
  appointments_last_30_days?: number;
}

export interface DayHours {
  open: boolean;
  start: string;
  end: string;
}

export interface BusinessSettingsRow {
  id: string;
  business_id: string;
  operating_hours: Record<string, DayHours> | null;
  notify_new_booking: boolean;
  notify_cancellation: boolean;
  notify_daily_summary: boolean;
  notify_weekly_report: boolean;
  notify_client_message: boolean;
  admin_locale: string;
  storefront_locale: string;
  currency_code: string;
  date_format: string;
  deposit_percent: number;
  allow_pay_later: boolean;
  cancellation_hours: number;
  reschedule_hours: number;
  auto_confirm: boolean;
  max_advance_days: number;
  buffer_minutes: number;
  enabled_payment_methods: string[];
  reminder_hours_before?: number;
}

export interface BusinessSettingsResponse {
  business: BusinessRow;
  settings: BusinessSettingsRow | null;
}

export interface UpdateBusinessSettingsInput {
  business_id: string;
  name?: string;
  business_type?: string;
  country?: string;
  operating_hours?: Record<string, DayHours>;
  notify_new_booking?: boolean;
  notify_cancellation?: boolean;
  notify_daily_summary?: boolean;
  notify_weekly_report?: boolean;
  notify_client_message?: boolean;
  admin_locale?: string;
  storefront_locale?: string;
  currency_code?: string;
  date_format?: string;
  deposit_percent?: number;
  allow_pay_later?: boolean;
  cancellation_hours?: number;
  reschedule_hours?: number;
  auto_confirm?: boolean;
  max_advance_days?: number;
  buffer_minutes?: number;
  enabled_payment_methods?: string[];
  reminder_hours_before?: number;
}

export interface ClientDetailRow extends ClientWithStats {
  notes?: string | null;
  tags?: string[];
  date_of_birth?: string | null;
  preferred_locale?: string | null;
  recent_appointments?: ClientRecentAppointment[];
}

export interface ClientRecentAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  booking_reference: string;
  price: number;
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  };
  staff: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export interface ImportClientsResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export interface ImportClientRow {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  source?: string;
}

export interface CreateClientInput {
  business_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface UpdateClientInput {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface StorefrontRow {
  id: string;
  business_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  extended_description: string | null;
  is_published: boolean;
  logo_url: string | null;
  cover_image_url: string | null;
  marketplace_status: string;
  marketplace_featured: boolean;
  city: string | null;
  phone: string | null;
  email?: string | null;
  address?: string | null;
  country_code?: string | null;
  website?: string | null;
}

export interface UpdateStorefrontData {
  title?: string | null;
  tagline?: string | null;
  description?: string | null;
  extended_description?: string | null;
  cover_image_url?: string | null;
  is_published?: boolean;
  marketplace_featured?: boolean;
  marketplace_status?: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country_code?: string | null;
  website?: string | null;
}

export interface GalleryItem {
  id: string;
  storefront_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

export interface StorefrontPromotion {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface BusinessRow {
  id: string;
  name: string;
  business_type: string | null;
  country: string | null;
}
