import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  connectPayPal,
  disconnectPayPal,
  getPayPalStatus,
} from "@/services/owner/paypalConnect";

const QUERY_KEY = "paypal-connect";

export function usePayPalConnect(businessId: string) {
  const queryClient = useQueryClient();

  const status = useQuery({
    queryKey: [QUERY_KEY, businessId],
    queryFn: () => getPayPalStatus(businessId),
    enabled: !!businessId,
    retry: false,
  });

  const connect = useMutation({
    mutationFn: (paypalEmail: string) => connectPayPal(businessId, paypalEmail),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY, businessId] });
    },
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectPayPal(businessId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY, businessId] });
    },
  });

  return { status, connect, disconnect };
}
