import type { Href } from "expo-router";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type OwnerDrawerIcon = ComponentProps<typeof Ionicons>["name"];

export type OwnerDrawerNavItem = {
  key: string;
  labelKey: string;
  href: Href;
  icon: OwnerDrawerIcon;
};

export type OwnerDrawerSection = {
  titleKey: string;
  items: OwnerDrawerNavItem[];
};

/** Sidebar structure aligned with web owner shell */
export const OWNER_DRAWER_SECTIONS: OwnerDrawerSection[] = [
  {
    titleKey: "owner.sectionOverview",
    items: [
      {
        key: "dashboard",
        labelKey: "owner.dashboard",
        href: "/(app)/owner/(tabs)" as Href,
        icon: "grid-outline",
      },
      {
        key: "appointments",
        labelKey: "owner.appointments",
        href: "/(app)/owner/(tabs)/appointments" as Href,
        icon: "calendar-outline",
      },
      {
        key: "clients",
        labelKey: "owner.clients",
        href: "/(app)/owner/(tabs)/clients" as Href,
        icon: "person-outline",
      },
      {
        key: "staff",
        labelKey: "owner.staff",
        href: "/(app)/owner/staff" as Href,
        icon: "cut-outline",
      },
    ],
  },
  {
    titleKey: "owner.sectionBusiness",
    items: [
      {
        key: "services",
        labelKey: "owner.services",
        href: "/(app)/owner/services" as Href,
        icon: "cut-outline",
      },
      {
        key: "finance",
        labelKey: "owner.finance",
        href: "/(app)/owner/finance" as Href,
        icon: "card-outline",
      },
      {
        key: "suppliers",
        labelKey: "owner.suppliers",
        href: "/(app)/owner/more" as Href,
        icon: "bus-outline",
      },
      {
        key: "storefront",
        labelKey: "owner.storefront",
        href: "/(app)/owner/storefront" as Href,
        icon: "storefront-outline",
      },
      {
        key: "marketplace",
        labelKey: "owner.marketplace",
        href: "/(app)/owner/more" as Href,
        icon: "bag-outline",
      },
      {
        key: "reports",
        labelKey: "owner.reports",
        href: "/(app)/owner/reports" as Href,
        icon: "bar-chart-outline",
      },
      {
        key: "ai-insights",
        labelKey: "owner.aiInsights",
        href: "/(app)/owner/more" as Href,
        icon: "sparkles-outline",
      },
      {
        key: "settings",
        labelKey: "owner.settings",
        href: "/(app)/owner/settings" as Href,
        icon: "settings-outline",
      },
    ],
  },
];
