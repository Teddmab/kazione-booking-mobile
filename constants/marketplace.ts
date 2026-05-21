/** Fixed category pills for V1 — values sent as `categories` query param to the API. */
export const MARKETPLACE_CATEGORIES = [
  'Braids',
  'Weaves',
  'Makeup',
  'Nails',
  'Skincare',
  'Wellness',
  'Massage',
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];

export const SALON_CARD_HEIGHT = 220;

export const MARKETPLACE_PAGE_SIZE = 10;
