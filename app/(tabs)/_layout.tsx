import { Redirect, type Href } from 'expo-router';

/** Ancien marketplace client — redirigé vers l’app owner. */
export default function TabsLayout() {
  return <Redirect href={'/' as Href} />;
}
