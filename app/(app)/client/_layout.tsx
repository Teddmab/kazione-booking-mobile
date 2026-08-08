import { Redirect, type Href } from 'expo-router';

/** Client journey disabled on mobile — staff-only app. */
export default function ClientStackLayout() {
  return <Redirect href={'/' as Href} />;
}
