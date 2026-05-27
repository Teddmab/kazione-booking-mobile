import { Redirect, type Href } from 'expo-router';

export default function LoginClientScreen() {
  return <Redirect href={'/(auth)/login' as Href} />;
}
