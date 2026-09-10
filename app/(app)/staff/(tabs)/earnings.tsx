import { Redirect, type Href } from "expo-router";

/** Deep-link alias — Gains is the default Performance screen. */
export default function StaffEarningsRedirect() {
  return <Redirect href={"/(app)/staff/(tabs)/performance" as Href} />;
}
