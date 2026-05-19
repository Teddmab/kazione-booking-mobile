import { api, ApiError } from "@/lib/api";
import type {
  AvailabilityParams,
  AvailabilityResult,
  CreateBookingParams,
  CreateBookingResult,
} from "@/types/booking";

export class SlotTakenError extends Error {
  alternatives: string[];
  constructor(alternatives: string[] = []) {
    super("This time slot is no longer available");
    this.name = "SlotTakenError";
    this.alternatives = alternatives;
  }
}

export async function getAvailability(params: AvailabilityParams): Promise<AvailabilityResult> {
  const qs = new URLSearchParams({
    business_id: params.business_id,
    service_id: params.service_id,
    date: params.date,
    ...(params.staff_id ? { staff_id: params.staff_id } : {}),
    ...(params.payment_method ? { payment_method: params.payment_method } : {}),
  });
  const result = await api.get<AvailabilityResult>(`/get-availability?${qs}`);
  return {
    ...result,
    reserved_slots: result.reserved_slots ?? [],
  };
}

export async function createBooking(params: CreateBookingParams): Promise<CreateBookingResult> {
  try {
    return await api.post<CreateBookingResult>("/create-booking", params);
  } catch (err) {
    if (err instanceof ApiError && err.status === 409 && err.code === "SLOT_TAKEN") {
      const alternatives =
        (err.details as { available_alternatives?: string[] })?.available_alternatives ?? [];
      throw new SlotTakenError(alternatives);
    }
    throw err;
  }
}
