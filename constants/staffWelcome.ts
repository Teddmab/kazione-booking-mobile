import type { ImageSourcePropType } from "react-native";

const DASHBOARD = require("../assets/images/onboarding/hero-dashboard.jpg");
const SALON_COVER = require("../assets/images/onboarding/salon-afrotouch-cover.jpg");
const MARKETPLACE = require("../assets/images/onboarding/marketplace-hero.jpg");

export type StaffWelcomeSlide = {
  image: ImageSourcePropType;
  kicker: string;
  title: string;
  body: string;
};

/** AsyncStorage flag — staff finished post-login welcome (per user) */
export function staffWelcomeStorageKey(userId: string): string {
  return `kazione_staff_welcome_complete_${userId}`;
}

export const STAFF_WELCOME_SLIDES: StaffWelcomeSlide[] = [
  {
    image: DASHBOARD,
    kicker: "Espace collaborateur",
    title: "Ta journée, en un coup d'œil",
    body: "Rendez-vous du jour, offres à accepter, bouton Démarrer — ton tableau de bord personnel, pas celui du gérant.",
  },
  {
    image: SALON_COVER,
    kicker: "Agenda et services",
    title: "Ton planning, tes prestations",
    body: "Consulte l'agenda, accepte les services proposés et partage ton lien de parrainage.",
  },
  {
    image: MARKETPLACE,
    kicker: "Suivi",
    title: "Tes résultats, tes clients",
    body: "Suis tes commissions, avis et clients du salon. Prêt ? On y va.",
  },
];
