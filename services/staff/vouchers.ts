import { api } from "@/lib/api";

export type VoucherVerifyResult = {
  id: string;
  status: string;
  offer_type: string | null;
  offer_title: string | null;
  currency_code: string;
  business_name: string | null;
  client_first_name: string | null;
  voucher_value: number | null;
  voucher_used: number | null;
  balance_remaining: number | null;
  sessions_total: number | null;
  sessions_used: number | null;
  sessions_remaining: number | null;
  issued_at: string;
  completed_at: string | null;
};

export function extractVoucherUuid(raw: string): string {
  const uuid = raw.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  return uuid ? uuid[0] : raw.trim();
}

export async function verifyVoucher(id: string): Promise<VoucherVerifyResult> {
  const params = new URLSearchParams({ action: "verify-voucher", id });
  const data = await api.get<{ voucher: VoucherVerifyResult }>(
    `/offers?${params}`,
  );
  return data.voucher;
}

export async function staffRedeemVoucher(redemptionId: string): Promise<void> {
  await api.post("/offers?action=staff-redeem", {
    redemption_id: redemptionId,
  });
}
