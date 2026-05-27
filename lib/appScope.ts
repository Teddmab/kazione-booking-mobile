/** Routes réservées à l’ancien parcours client (marketplace, réservation). */
const CUSTOMER_ROOT_SEGMENTS = new Set(['(tabs)', 'salon', 'booking', 'payment']);

export function isCustomerRoute(segments: readonly string[]): boolean {
  if (!segments.length) return false;
  if (CUSTOMER_ROOT_SEGMENTS.has(segments[0] as string)) return true;
  return segments[0] === '(app)' && segments[1] === 'client';
}
