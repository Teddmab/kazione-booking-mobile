import type { Href } from "expo-router";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type StaffDrawerIcon = ComponentProps<typeof Ionicons>["name"];

export type StaffDrawerNavItem = {
  key: string;
  label: string;
  href: Href;
  icon: StaffDrawerIcon;
};

export type StaffDrawerSection = {
  title: string;
  items: StaffDrawerNavItem[];
};

/** Sidebar aligned with web staff AppSidebar */
export const STAFF_DRAWER_SECTIONS: StaffDrawerSection[] = [
  {
    title: "APERÇU",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        href: "/(app)/staff/(tabs)/today" as Href,
        icon: "grid-outline",
      },
      {
        key: "appointments",
        label: "Agenda",
        href: "/(app)/staff/(tabs)/calendar" as Href,
        icon: "calendar-outline",
      },
      {
        key: "clients",
        label: "Clients",
        href: "/(app)/staff/clients" as Href,
        icon: "people-outline",
      },
      {
        key: "services",
        label: "Services",
        href: "/(app)/staff/(tabs)/services" as Href,
        icon: "cut-outline",
      },
      {
        key: "reports",
        label: "Performance",
        href: "/(app)/staff/(tabs)/performance" as Href,
        icon: "bar-chart-outline",
      },
      {
        key: "reviews",
        label: "Avis",
        href: "/(app)/staff/reviews" as Href,
        icon: "star-outline",
      },
      {
        key: "notifications",
        label: "Notifications",
        href: "/(app)/staff/notifications" as Href,
        icon: "notifications-outline",
      },
      {
        key: "account",
        label: "Mon compte",
        href: "/(app)/staff/profile" as Href,
        icon: "person-outline",
      },
    ],
  },
];
