import { api } from "@/lib/api";
import type { StaffMember, StaffWorkingDay } from "@/types/owner";

export interface InviteStaffInput {
  business_id: string;
  email: string;
  display_name: string;
  role: string;
  position?: string | null;
}

export interface UpdateStaffInput {
  display_name?: string;
  role?: string;
  is_active?: boolean;
}

export async function getStaffList(businessId: string): Promise<StaffMember[]> {
  return api.get<StaffMember[]>(`/staff?business_id=${encodeURIComponent(businessId)}`);
}

export async function inviteStaff(input: InviteStaffInput): Promise<{
  invite_sent: boolean;
  email: string;
  staff_profile_id: string;
}> {
  return api.post("/invite-staff", input);
}

export async function updateStaff(id: string, data: UpdateStaffInput): Promise<StaffMember> {
  return api.patch<StaffMember>(`/staff?id=${encodeURIComponent(id)}`, data);
}

export async function updateStaffSchedule(
  staffId: string,
  schedule: StaffWorkingDay[],
): Promise<{ success: boolean; schedule: StaffWorkingDay[] }> {
  return api.put(`/staff?action=schedule&id=${encodeURIComponent(staffId)}`, schedule);
}

export async function getStaffServices(staffId: string): Promise<{ service_ids: string[] }> {
  return api.get(`/staff?action=services&id=${encodeURIComponent(staffId)}`);
}

export async function assignStaffServices(
  staffId: string,
  serviceIds: string[],
): Promise<{ success: boolean; service_ids: string[] }> {
  return api.patch(`/staff?action=assign-services&id=${encodeURIComponent(staffId)}`, {
    service_ids: serviceIds,
  });
}

export async function resendStaffInvite(staffId: string): Promise<{
  invite_sent: boolean;
  email: string;
  email_error?: string | null;
}> {
  return api.patch(`/staff?action=resend-invite&id=${encodeURIComponent(staffId)}`, {});
}
