import { Redirect, type Href } from 'expo-router';

export default function LoginTeamScreen() {
  return <Redirect href={'/(auth)/login' as Href} />;
}
