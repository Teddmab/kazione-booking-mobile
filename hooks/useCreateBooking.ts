import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { createBooking, SlotTakenError } from "@/services/booking";
import type { CreateBookingParams, CreateBookingResult } from "@/types/booking";

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const mutation = useMutation<CreateBookingResult, Error, CreateBookingParams>({
    mutationFn: createBooking,
    onSuccess: () => {
      setAlternatives([]);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (error) => {
      if (error instanceof SlotTakenError) {
        setAlternatives(error.alternatives);
      }
    },
  });

  return { ...mutation, alternatives, clearAlternatives: () => setAlternatives([]) };
}
