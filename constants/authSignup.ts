/** Mirrors web `SignupPage.tsx` business type & country lists. */
export const BUSINESS_TYPES = [
  { value: 'hair_salon', labelKey: 'auth.businessTypes.hair_salon' },
  { value: 'barbershop', labelKey: 'auth.businessTypes.barbershop' },
  { value: 'beauty_salon', labelKey: 'auth.businessTypes.beauty_salon' },
  { value: 'nail_salon', labelKey: 'auth.businessTypes.nail_salon' },
  { value: 'spa', labelKey: 'auth.businessTypes.spa' },
  { value: 'other', labelKey: 'auth.businessTypes.other' },
] as const;

export const SIGNUP_COUNTRIES = [
  { value: 'NL', labelKey: 'auth.countries.NL' },
  { value: 'BE', labelKey: 'auth.countries.BE' },
  { value: 'DE', labelKey: 'auth.countries.DE' },
  { value: 'FR', labelKey: 'auth.countries.FR' },
  { value: 'GB', labelKey: 'auth.countries.GB' },
  { value: 'US', labelKey: 'auth.countries.US' },
  { value: 'ZA', labelKey: 'auth.countries.ZA' },
  { value: 'KE', labelKey: 'auth.countries.KE' },
  { value: 'NG', labelKey: 'auth.countries.NG' },
  { value: 'OTHER', labelKey: 'auth.countries.OTHER' },
] as const;

export type BusinessTypeValue = (typeof BUSINESS_TYPES)[number]['value'];
export type SignupCountryValue = (typeof SIGNUP_COUNTRIES)[number]['value'];
