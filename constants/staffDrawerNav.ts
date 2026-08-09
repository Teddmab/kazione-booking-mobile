import type { Href } from "expo-router";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type StaffDrawerIcon = ComponentProps<typeof Ionicons>["name"];

export type StaffDrawerNavItem = {
  key: string;
  /** i18n key, e.g. sidebar.dashboard */
  labelKey: string;
  href: Href;
  icon: StaffDrawerIcon;
};

export type StaffDrawerSection = {
  titleKey: string;
  items: StaffDrawerNavItem[];
};

/** Sidebar aligned with web staff AppSidebar — labels via i18n */
export const STAFF_DRAWER_SECTIONS: StaffDrawerSection[] = [
  {
    titleKey: "staffNav.overview",
    items: [
      {
        key: "dashboard",
        labelKey: "sidebar.dashboard",
        href: "/(app)/staff/(tabs)/today" as Href,
        icon: "grid-outline",
      },
      {
        key: "appointments",
        labelKey: "sidebar.appointments",
        href: "/(app)/staff/(tabs)/calendar" as Href,
        icon: "calendar-outline",
      },
      {
        key: "clients",
        labelKey: "sidebar.clients",
        href: "/(app)/staff/clients" as Href,
        icon: "people-outline",
      },
      {
        key: "services",
        labelKey: "sidebar.services",
        href: "/(app)/staff/(tabs)/services" as Href,
        icon: "cut-outline",
      },
      {
        key: "reports",
        labelKey: "sidebar.reports",
        href: "/(app)/staff/(tabs)/performance" as Href,
        icon: "bar-chart-outline",
      },
      {
        key: "reviews",
        labelKey: "sidebar.reviews",
        href: "/(app)/staff/reviews" as Href,
        icon: "star-outline",
      },
      {
        key: "notifications",
        labelKey: "nav.notifications",
        href: "/(app)/staff/notifications" as Href,
        icon: "notifications-outline",
      },
      {
        key: "account",
        labelKey: "sidebar.account",
        href: "/(app)/staff/profile" as Href,
        icon: "person-outline",
      },
    ],
  },
];
