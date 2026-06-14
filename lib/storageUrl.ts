/**
 * Local Supabase returns storage URLs with 127.0.0.1, localhost, or Docker hostnames.
 * On a physical device, rewrite to EXPO_PUBLIC_SUPABASE_URL (LAN IP).
 * Web works with 127.0.0.1 because the browser runs on the same machine as Supabase.
 */
export function rewriteStorageUrlForDevice(url: string | null | undefined): string {
  if (!url?.trim()) return url ?? "";

  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!base) return url;

  const storageIdx = url.indexOf("/storage/");
  if (storageIdx === -1) return url;

  const pathAndQuery = url.slice(storageIdx);
  return `${base}${pathAndQuery}`;
}
