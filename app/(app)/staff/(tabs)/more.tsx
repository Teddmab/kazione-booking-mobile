import { Redirect, type Href } from "expo-router";

/** More is a bottom sheet — keep route for deep links / old refs. */
export default function StaffMoreRedirect() {
  return <Redirect href={"/(app)/staff/(tabs)/today" as Href} />;
}
