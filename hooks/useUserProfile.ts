import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getUserProfile, updateUserProfile } from "@/services/owner/profile";

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    staleTime: 60_000,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
