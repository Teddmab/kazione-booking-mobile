export type OwnerNavItem = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
};

export const OWNER_QUICK_NAV: OwnerNavItem[] = [
  {
    key: 'clients',
    title: 'Clients',
    subtitle: 'Client roster and history',
    href: '/(app)/owner/clients',
  },
  {
    key: 'services',
    title: 'Services',
    subtitle: 'Pricing and durations',
    href: '/(app)/owner/services',
  },
  {
    key: 'storefront',
    title: 'Storefront',
    subtitle: 'Public profile and gallery',
    href: '/(app)/owner/storefront',
  },
  {
    key: 'settings',
    title: 'Settings',
    subtitle: 'Business info and preferences',
    href: '/(app)/owner/settings',
  },
];
