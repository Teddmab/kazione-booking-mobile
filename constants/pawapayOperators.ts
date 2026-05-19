export const MOBILE_OPERATOR_OPTIONS = [
  { value: "MTN_MOMO_UGA", label: "MTN Mobile Money (Uganda)", currency: "UGX" },
  { value: "AIRTEL_OAPI_UGA", label: "Airtel Money (Uganda)", currency: "UGX" },
  { value: "MTN_MOMO_GHA", label: "MTN Mobile Money (Ghana)", currency: "GHS" },
  { value: "MTN_MOMO_ZMB", label: "MTN Mobile Money (Zambia)", currency: "ZMW" },
  { value: "ZAMTEL_ZMB", label: "Zamtel Money (Zambia)", currency: "ZMW" },
  { value: "ORANGE_SEN", label: "Orange Money (Senegal)", currency: "XOF" },
  { value: "FREE_SEN", label: "Free Money (Senegal)", currency: "XOF" },
  { value: "ORANGE_CIV", label: "Orange Money (Cote d'Ivoire)", currency: "XOF" },
  { value: "VODACOM_TZA", label: "Vodacom M-Pesa (Tanzania)", currency: "TZS" },
  { value: "TIGO_TZA", label: "Tigo Pesa (Tanzania)", currency: "TZS" },
  { value: "HALOTEL_TZA", label: "Halopesa (Tanzania)", currency: "TZS" },
  { value: "MPESA_KEN", label: "M-Pesa (Kenya)", currency: "KES" },
] as const;

export type MobileOperatorCode = (typeof MOBILE_OPERATOR_OPTIONS)[number]["value"];
