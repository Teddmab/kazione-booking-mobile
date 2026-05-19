export type OwnerNavItem = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
};

export const OWNER_QUICK_NAV: OwnerNavItem[] = [
  {
    key: "appointments",
    title: "Rendez-vous",
    subtitle: "Calendrier et statuts",
    href: "/(app)/owner/appointments",
  },
  {
    key: "clients",
    title: "Clients",
    subtitle: "Fichier client",
    href: "/(app)/owner/clients",
  },
  {
    key: "staff",
    title: "Équipe",
    subtitle: "Membres du salon",
    href: "/(app)/owner/staff",
  },
  {
    key: "services",
    title: "Services",
    subtitle: "Prestations et tarifs",
    href: "/(app)/owner/services",
  },
  {
    key: "storefront",
    title: "Vitrine",
    subtitle: "Page publique",
    href: "/(app)/owner/storefront",
  },
  {
    key: "settings",
    title: "Paramètres",
    subtitle: "Salon et compte",
    href: "/(app)/owner/settings",
  },
];
