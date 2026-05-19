import { api } from "@/lib/api";
import type { StaffMember } from "@/types/owner";

export async function getStaffList(businessId: string): Promise<StaffMember[]> {
  return api.get<StaffMember[]>(`/staff?business_id=${encodeURIComponent(businessId)}`);
}
