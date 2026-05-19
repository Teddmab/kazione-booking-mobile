/** First 16 chars of key body after mode — safe to compare with backend `stripe_key_hint`. */
export function extractStripeKeyHint(key: string | null | undefined): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  const match = trimmed.match(/^(?:sk|pk)_(?:live|test)_([A-Za-z0-9]{16})/);
  return match?.[1] ?? null;
}
