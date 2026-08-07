import { Redirect, type Href } from 'expo-router';

/** Owner signup is web-only — mobile app is staff-only. */
export default function SignupScreen() {
  return <Redirect href={'/(auth)/login' as Href} />;
}
