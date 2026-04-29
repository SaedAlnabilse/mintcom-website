export const normalizeCurrencyCode = (currency: string | null | undefined, fallback = 'USD') => {
  const normalized = currency?.trim().toUpperCase();
  return normalized || fallback;
};

export const formatCurrencyCode = (
  amount: number | string | null | undefined,
  currency: string | null | undefined = 'USD',
  locale = 'en-US',
  options: Intl.NumberFormatOptions = {},
) => {
  const currencyCode = normalizeCurrencyCode(currency);
  const numericAmount = typeof amount === 'number' ? amount : Number.parseFloat(String(amount ?? 0));
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  const formattedAmount = safeAmount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });

  return `${formattedAmount} ${currencyCode}`;
};

export const formatCompactCurrencyCode = (
  amount: number | string | null | undefined,
  currency: string | null | undefined = 'USD',
  locale = 'en-US',
) => {
  const currencyCode = normalizeCurrencyCode(currency);
  const numericAmount = typeof amount === 'number' ? amount : Number.parseFloat(String(amount ?? 0));
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  const absAmount = Math.abs(safeAmount);

  if (absAmount >= 1000000) {
    return `${(safeAmount / 1000000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M ${currencyCode}`;
  }

  if (absAmount >= 1000) {
    return `${(safeAmount / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K ${currencyCode}`;
  }

  return formatCurrencyCode(safeAmount, currencyCode, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
