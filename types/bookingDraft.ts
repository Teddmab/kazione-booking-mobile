export type PaymentOption = 'full' | 'deposit' | 'at_salon';

export interface BookingResult {
  id: string;
  reference: string;
  status: string;
}

/** Maps wizard payment option to create-booking API. */
export function paymentOptionToApiMethod(option: PaymentOption): 'full' | 'deposit' | 'later' {
  if (option === 'at_salon') return 'later';
  return option;
}
