import { getSupabase } from "@/lib/supabase";
import type {
  BusinessRow,
  BusinessSettingsResponse,
  BusinessSettingsRow,
  UpdateBusinessSettingsInput,
} from "@/types/owner";

/**
 * Same path as web `useBusinessSettings`: read/write `business_settings`
 * (and `businesses`) via the Supabase client + RLS — not a missing Edge Function.
 */
export async function getBusinessSettings(
  businessId: string,
): Promise<BusinessSettingsResponse> {
  const supabase = getSupabase();

  const [businessRes, settingsRes] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, business_type, country")
      .eq("id", businessId)
      .single(),
    supabase
      .from("business_settings")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);

  if (businessRes.error) throw businessRes.error;
  if (settingsRes.error) throw settingsRes.error;

  return {
    business: businessRes.data as BusinessRow,
    settings: (settingsRes.data as BusinessSettingsRow) ?? null,
  };
}

export async function patchBusinessSettings(
  input: UpdateBusinessSettingsInput,
): Promise<BusinessSettingsResponse> {
  const supabase = getSupabase();
  const { business_id, name, business_type, country, ...settingsPatch } = input;

  if (name !== undefined || business_type !== undefined || country !== undefined) {
    const businessUpdate: Record<string, string | null> = {};
    if (name !== undefined) businessUpdate.name = name;
    if (business_type !== undefined) businessUpdate.business_type = business_type;
    if (country !== undefined) businessUpdate.country = country;

    const { error } = await supabase
      .from("businesses")
      .update(businessUpdate)
      .eq("id", business_id);
    if (error) throw error;
  }

  if (Object.keys(settingsPatch).length > 0) {
    const { error } = await supabase
      .from("business_settings")
      .upsert({ business_id, ...settingsPatch }, { onConflict: "business_id" });
    if (error) throw error;
  }

  return getBusinessSettings(business_id);
}
