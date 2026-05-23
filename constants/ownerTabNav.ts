import type { Href } from "expo-router";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type OwnerTabIcon = ComponentProps<typeof Ionicons>["name"];

export type OwnerTabRoute = {
  name: string;
  titleKey: string;
  href: Href;
  icon: OwnerTabIcon;
  iconFocused: OwnerTabIcon;
};

/** Bottom tab bar — core screens */
export const OWNER_BOTTOM_TABS: OwnerTabRoute[] = [
  {
    name: "index",
    titleKey: "owner.tabHome",
    href: "/(app)/owner/(tabs)" as Href,
    icon: "grid-outline",
    iconFocused: "grid",
  },
  {
    name: "appointments",
    titleKey: "owner.tabAppointments",
    href: "/(app)/owner/(tabs)/appointments" as Href,
    icon: "calendar-outline",
    iconFocused: "calendar",
  },
  {
    name: "clients",
    titleKey: "owner.tabClients",
    href: "/(app)/owner/(tabs)/clients" as Href,
    icon: "people-outline",
    iconFocused: "people",
  },
  {
    name: "more",
    titleKey: "owner.tabMore",
    href: "/(app)/owner/(tabs)/more" as Href,
    icon: "ellipsis-horizontal",
    iconFocused: "ellipsis-horizontal",
  },
];
