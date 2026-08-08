import { Redirect, type Href } from 'expo-router';

/** Business creation is web-only — mobile app is staff-only. */
export default function CreateBusinessScreen() {
  return <Redirect href={'/(auth)/login' as Href} />;
}
