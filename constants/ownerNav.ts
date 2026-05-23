import type { Href } from "expo-router";

export type OwnerNavItem = {
  key: string;
  titleKey: string;
  subtitleKey: string;
  href: string;
};

export const OWNER_QUICK_NAV: OwnerNavItem[] = [
  {
    key: "appointments",
    titleKey: "owner.appointments",
    subtitleKey: "owner.tabAppointments",
    href: "/(app)/owner/(tabs)/appointments",
  },
  {
    key: "clients",
    titleKey: "owner.clients",
    subtitleKey: "owner.clients",
    href: "/(app)/owner/(tabs)/clients",
  },
  {
    key: "staff",
    titleKey: "owner.staff",
    subtitleKey: "owner.staff",
    href: "/(app)/owner/staff",
  },
  {
    key: "services",
    titleKey: "owner.services",
    subtitleKey: "owner.services",
    href: "/(app)/owner/services",
  },
  {
    key: "storefront",
    titleKey: "owner.storefront",
    subtitleKey: "owner.storefront",
    href: "/(app)/owner/storefront",
  },
  {
    key: "settings",
    titleKey: "owner.settings",
    subtitleKey: "owner.settings",
    href: "/(app)/owner/settings",
  },
];
