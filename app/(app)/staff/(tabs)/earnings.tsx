import { Redirect, type Href } from "expo-router";

/** Earnings lives under Performance (tab=earnings) — keep this route for deep links. */
export default function StaffEarningsScreen() {
  return (
    <Redirect
      href={"/(app)/staff/(tabs)/performance?tab=earnings" as Href}
    />
  );
}
