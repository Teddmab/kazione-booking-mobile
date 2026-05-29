export function formatBookingDateLong(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatMoney(amount: number, currencyCode: string): string {
  const sym = currencyCode === 'EUR' ? '€' : currencyCode === 'USD' ? '$' : '';
  return `${sym}${amount.toFixed(2)}`;
}

export function depositAmount(price: number, percent = 30): number {
  return Math.ceil(price * (percent / 100));
}
