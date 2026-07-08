import * as Linking from 'expo-linking';

const WEB_BASE = process.env.EXPO_PUBLIC_WEB_APP_URL ?? 'https://kazione.app';

export interface StorefrontPreviewOptions {
  onOpenFailed?: (title: string, message: string) => void;
}

export async function openStorefrontPreview(
  slug: string,
  options?: StorefrontPreviewOptions,
): Promise<void> {
  const url = `${WEB_BASE.replace(/\/$/, '')}/client/salon/${slug}`;
  try {
    await Linking.openURL(url);
  } catch {
    options?.onOpenFailed?.('Preview', url);
  }
}
