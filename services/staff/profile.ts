import { api } from "@/lib/api";

export interface StaffWorkingDay {
  day: number; // 0=Sun … 6=Sat
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

export type StaffScheduleDay = StaffWorkingDay;

export interface StaffOverride {
  id: string;
  override_date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface StaffSelf {
  staff_profile_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name?: string | null;
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

export async function updateSelfProfile(fields: {
  display_name?: string;
}): Promise<StaffSelf> {
  return api.patch<StaffSelf>("/staff?action=update-self", fields);
}

export async function updateSelfSchedule(
  schedule: StaffScheduleDay[],
): Promise<{ success: boolean; schedule: StaffScheduleDay[] }> {
  return api.put<{ success: boolean; schedule: StaffScheduleDay[] }>(
    "/staff?action=self-schedule",
    schedule,
  );
}

export async function getSelfOverrides(
  from?: string,
  to?: string,
): Promise<StaffOverride[]> {
  const qs = new URLSearchParams({ action: "self-overrides" });
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const data = await api.get<StaffOverride[] | { overrides: StaffOverride[] }>(
    `/staff?${qs.toString()}`,
  );
  return Array.isArray(data) ? data : (data.overrides ?? []);
}

export async function upsertSelfOverride(
  override: Omit<StaffOverride, "id">,
): Promise<StaffOverride> {
  return api.post<StaffOverride>("/staff?action=self-override", override);
}

export async function deleteSelfOverride(date: string): Promise<void> {
  await api.delete(
    `/staff?action=self-override&date=${encodeURIComponent(date)}`,
  );
}
