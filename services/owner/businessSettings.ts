import { api } from "@/lib/api";
import type {
  BusinessSettingsResponse,
  UpdateBusinessSettingsInput,
} from "@/types/owner";

export async function getBusinessSettings(
  businessId: string,
): Promise<BusinessSettingsResponse> {
  return api.get<BusinessSettingsResponse>(
    `/business-settings?business_id=${encodeURIComponent(businessId)}`,
  );
}

export async function patchBusinessSettings(
  input: UpdateBusinessSettingsInput,
): Promise<BusinessSettingsResponse> {
  return api.patch<BusinessSettingsResponse>("/business-settings", input);
}
