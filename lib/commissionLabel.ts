import type { CommissionType } from "@/services/staff/services";

export function commissionLabel(
  type: CommissionType | string | null | undefined,
  value: number | null | undefined,
  currency = "EUR",
): string {
  if (!type || type === "none" || value == null) return "Sans commission";
  if (type === "percentage") return `${value}% de commission`;
  if (type === "fixed") {
    return `${currency} ${Number(value).toFixed(2)} / RDV`;
  }
  return "Sans commission";
}

export function commissionEarnings(
  type: CommissionType | string | null | undefined,
  value: number | null | undefined,
  price: number,
): number | null {
  if (type === "percentage" && value != null) {
    return Math.round(price * (value / 100) * 100) / 100;
  }
  if (type === "fixed" && value != null) return value;
  return null;
}
