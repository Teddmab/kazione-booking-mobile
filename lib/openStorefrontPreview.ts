import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

const WEB_BASE = process.env.EXPO_PUBLIC_WEB_APP_URL ?? 'https://kazione.app';

export async function openStorefrontPreview(slug: string): Promise<void> {
  const url = `${WEB_BASE.replace(/\/$/, '')}/client/salon/${slug}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Preview', url);
  }
}
