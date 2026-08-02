import { api } from "@/lib/api";

export interface StaffWorkingDay {
  day: number; // 0=Sun … 6=Sat
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface StaffSelf {
  staff_profile_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  position?: string | null;
  working_hours: StaffWorkingDay[];
}

/** Current staff profile + working hours via GET /staff?action=self */
export async function fetchStaffSelf(businessId: string): Promise<StaffSelf> {
  return api.get<StaffSelf>(
    `/staff?action=self&business_id=${encodeURIComponent(businessId)}`,
  );
}
