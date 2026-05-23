import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { getSupabase } from "@/lib/supabase";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  return session?.access_token ?? null;
}

export async function exportReportCsv(params: {
  businessId: string;
  type: "appointments" | "revenue" | "clients";
  from: string;
  to: string;
}): Promise<void> {
  if (!BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not set");
  }

  const token = await getAccessToken();
  const qs = new URLSearchParams({
    type: params.type,
    from: params.from,
    to: params.to,
    format: "csv",
    business_id: params.businessId,
  });

  const headers: Record<string, string> = {};
  if (SUPABASE_ANON_KEY) headers.apikey = SUPABASE_ANON_KEY;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/export-report?${qs}`, { headers });
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }

  const csv = await res.text();
  const filename = `${params.type}-${params.from}-${params.to}.csv`;
  const file = new File(Paths.cache, filename);
  file.write(csv);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: filename,
    UTI: "public.comma-separated-values-text",
  });
}
