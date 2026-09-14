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

/** Keys gated by staff_module_permissions */
export const STAFF_PERMISSION_KEYS = new Set([
  "clients",
  "reports",
  "earnings",
  "account",
]);

/**
 * Secondary destinations shown in the More tab.
 * Primary bottom tabs (Today / Appointments / Services / Reviews) are excluded.
 */
export const STAFF_MORE_ITEMS: StaffDrawerNavItem[] = [
  {
    key: "clients",
    labelKey: "sidebar.clients",
    href: "/(app)/staff/(tabs)/clients" as Href,
    icon: "people-outline",
  },
  {
    key: "earnings",
    labelKey: "sidebar.earnings",
    href: "/(app)/staff/(tabs)/performance" as Href,
    icon: "wallet-outline",
  },
  {
    key: "reports",
    labelKey: "sidebar.reports",
    href: "/(app)/staff/(tabs)/performance?tab=overview" as Href,
    icon: "bar-chart-outline",
  },
  {
    key: "training",
    labelKey: "sidebar.training",
    href: "/(app)/staff/(tabs)/training" as Href,
    icon: "book-outline",
  },
  {
    key: "notifications",
    labelKey: "nav.notifications",
    href: "/(app)/staff/(tabs)/notifications" as Href,
    icon: "notifications-outline",
  },
  {
    key: "account",
    labelKey: "sidebar.account",
    href: "/(app)/staff/(tabs)/profile" as Href,
    icon: "person-outline",
  },
];

/** Path segments that belong under the More tab (for tab-bar active state). */
export const STAFF_MORE_PATH_MARKERS = [
  "/clients",
  "/performance",
  "/earnings",
  "/training",
  "/notifications",
  "/profile",
  "/more",
] as const;

/** @deprecated Sidebar removed — kept for any residual imports */
export const STAFF_DRAWER_SECTIONS = [
  {
    titleKey: "staffNav.overview",
    items: STAFF_MORE_ITEMS,
  },
];
