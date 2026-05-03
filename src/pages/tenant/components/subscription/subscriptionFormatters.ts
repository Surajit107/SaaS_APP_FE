const moneyFormatterCache = new Map<string, Intl.NumberFormat>();

export function formatPrice(amount: number, currency: string): string {
  const normalized = currency.toUpperCase();
  const existing = moneyFormatterCache.get(normalized);
  if (existing) {
    return existing.format(amount);
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalized,
    maximumFractionDigits: 2,
  });
  moneyFormatterCache.set(normalized, formatter);

  return formatter.format(amount);
}

export function formatInterval(interval: string): string {
  const clean = interval.trim().toLowerCase();
  if (clean === 'month') return 'monthly';
  if (clean === 'year') return 'yearly';
  return clean;
}
