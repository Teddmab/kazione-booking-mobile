export const BUSINESS_TYPE_OPTIONS = [
  { value: "hair_salon", label: "Salon de coiffure" },
  { value: "barbershop", label: "Barbershop" },
  { value: "beauty_salon", label: "Institut beauté" },
  { value: "nail_salon", label: "Studio ongles" },
  { value: "spa", label: "Spa" },
  { value: "massage_studio", label: "Studio massage" },
  { value: "fitness", label: "Fitness" },
  { value: "cleaning_service", label: "Services ménagers" },
  { value: "professional_services", label: "Services pro" },
  { value: "home_services", label: "Services à domicile" },
  { value: "other", label: "Autre" },
] as const;

export const COUNTRY_OPTIONS = [
  { code: "BE", label: "Belgique" },
  { code: "CD", label: "RD Congo" },
  { code: "CG", label: "Congo" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "CM", label: "Cameroun" },
  { code: "DE", label: "Allemagne" },
  { code: "EE", label: "Estonie" },
  { code: "FI", label: "Finlande" },
  { code: "FR", label: "France" },
  { code: "GB", label: "Royaume-Uni" },
  { code: "GH", label: "Ghana" },
  { code: "KE", label: "Kenya" },
  { code: "NL", label: "Pays-Bas" },
  { code: "NG", label: "Nigeria" },
  { code: "RW", label: "Rwanda" },
  { code: "SE", label: "Suède" },
  { code: "SN", label: "Sénégal" },
  { code: "TZ", label: "Tanzanie" },
  { code: "UG", label: "Ouganda" },
  { code: "US", label: "États-Unis" },
  { code: "ZA", label: "Afrique du Sud" },
  { code: "ZM", label: "Zambie" },
] as const;

export const REMINDER_HOUR_OPTIONS = [1, 2, 4, 8, 12, 24, 48] as const;

export function reminderHoursLabel(hours: number): string {
  if (hours === 24) return "24 heures (défaut)";
  if (hours === 48) return "48 heures";
  return `${hours} heure${hours > 1 ? "s" : ""} avant`;
}

export const STOREFRONT_LOCALE_OPTIONS = [
  { value: "auto", label: "Auto (navigateur client)" },
  { value: "en", label: "Anglais (EN)" },
  { value: "et", label: "Estonien (ET)" },
  { value: "fr", label: "Français (FR)" },
  { value: "ru", label: "Russe (RU)" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "USD", label: "USD ($)" },
] as const;

export const DATE_FORMAT_OPTIONS = [
  { value: "dmy", label: "JJ/MM/AAAA" },
  { value: "mdy", label: "MM/JJ/AAAA" },
  { value: "ymd", label: "AAAA-MM-JJ" },
] as const;

export type RoleKey = "owner" | "staff" | "receptionist";

export const PERMISSION_MODULES = [
  { key: "dashboard", label: "Tableau de bord" },
  { key: "appointments", label: "Rendez-vous" },
  { key: "clients", label: "Clients" },
  { key: "staff", label: "Équipe" },
  { key: "finances", label: "Finance" },
  { key: "reports", label: "Rapports" },
  { key: "settings", label: "Paramètres" },
  { key: "marketplace", label: "Marketplace" },
] as const;

export type RolePermissions = Record<RoleKey, Record<string, boolean>>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  owner: {
    dashboard: true,
    appointments: true,
    clients: true,
    staff: true,
    finances: true,
    reports: true,
    settings: true,
    marketplace: true,
  },
  staff: {
    dashboard: true,
    appointments: true,
    clients: true,
    staff: false,
    finances: false,
    reports: false,
    settings: false,
    marketplace: false,
  },
  receptionist: {
    dashboard: true,
    appointments: true,
    clients: true,
    staff: false,
    finances: true,
    reports: false,
    settings: false,
    marketplace: false,
  },
};

export const ROLE_LABELS: Record<RoleKey, { title: string; desc: string }> = {
  owner: { title: "Gérant", desc: "Accès complet — non modifiable" },
  staff: { title: "Coiffeur·se", desc: "Accès opérationnel au salon" },
  receptionist: { title: "Réception", desc: "Accueil et encaissement" },
};
