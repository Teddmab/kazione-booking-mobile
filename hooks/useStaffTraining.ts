import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import {
  fetchPlayerData,
  fetchStaffTraining,
  markSectionComplete,
  registerForTraining,
  type TrainingPlayerData,
} from "@/services/staff/training";

export function useStaffTraining() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useQuery({
    queryKey: ["staff-training", businessId],
    queryFn: () => fetchStaffTraining(businessId),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useRegisterForTraining() {
  const qc = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useMutation({
    mutationFn: (offerId: string) => registerForTraining(offerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff-training", businessId] });
    },
  });
}

export function usePlayerData(redemptionId: string | null) {
  return useQuery({
    queryKey: ["training-player", redemptionId],
    queryFn: () => fetchPlayerData(redemptionId!),
    enabled: !!redemptionId,
    staleTime: 0,
  });
}

export function useMarkSectionComplete() {
  const qc = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useMutation({
    mutationFn: ({
      redemptionId,
      sectionId,
    }: {
      redemptionId: string;
      sectionId: string;
    }) => markSectionComplete(redemptionId, sectionId),
    onMutate: async ({ redemptionId, sectionId }) => {
      await qc.cancelQueries({ queryKey: ["training-player", redemptionId] });
      const previous = qc.getQueryData<TrainingPlayerData>([
        "training-player",
        redemptionId,
      ]);
      if (previous) {
        const completed = new Set(previous.completed_sections ?? []);
        completed.add(sectionId);
        qc.setQueryData<TrainingPlayerData>(["training-player", redemptionId], {
          ...previous,
          completed_sections: [...completed],
        });
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(
          ["training-player", vars.redemptionId],
          ctx.previous,
        );
      }
    },
    onSettled: (_data, _err, vars) => {
      void qc.invalidateQueries({
        queryKey: ["training-player", vars.redemptionId],
      });
      void qc.invalidateQueries({ queryKey: ["staff-training", businessId] });
    },
  });
}
