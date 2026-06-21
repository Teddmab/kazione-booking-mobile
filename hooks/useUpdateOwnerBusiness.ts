import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getSupabase } from "@/lib/supabase";
import type { BusinessRow } from "@/types/owner";

export interface UpdateOwnerBusinessInput {
  name?: string;
  business_type?: string;
  country?: string | null;
}

export function useUpdateOwnerBusiness(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateOwnerBusinessInput) => {
      const { data: updated, error } = await getSupabase()
        .from("businesses")
        .update(data)
        .eq("id", businessId)
        .select("id, name, business_type, country")
        .single();
      if (error) throw error;
      return updated as BusinessRow;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-business", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-business-settings", businessId] });
    },
  });
}
