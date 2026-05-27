import { Redirect, type Href } from 'expo-router';

/** Parcours client désactivé sur mobile — owner uniquement. */
export default function ClientStackLayout() {
  return <Redirect href={'/' as Href} />;
}
