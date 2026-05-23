import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createBusiness } from "@/services/owner/business";

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBusiness,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
}
