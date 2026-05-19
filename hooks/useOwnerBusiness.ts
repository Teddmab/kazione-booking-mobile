import { useQuery } from "@tanstack/react-query";

import { getSupabase } from "@/lib/supabase";
import type { BusinessRow } from "@/types/owner";

export function useOwnerBusiness(businessId: string | undefined) {
  return useQuery<BusinessRow | null>({
    queryKey: ["owner-business", businessId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("businesses")
        .select("id, name, business_type, country")
        .eq("id", businessId!)
        .single();
      if (error) throw error;
      return data as BusinessRow;
    },
    enabled: !!businessId,
    staleTime: 300_000,
  });
}
