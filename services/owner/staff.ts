import { api } from "@/lib/api";
import type { StaffMember } from "@/types/owner";

export interface InviteStaffInput {
  business_id: string;
  email: string;
  display_name: string;
  role: string;
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
