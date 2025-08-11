/**
 * Currency formatting utilities
 */

export interface CurrencyFormatterOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Formats a number as currency using Intl.NumberFormat
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatterOptions = {}
): string {
  const {
    currency = 'USD',
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch (error) {
    // Fallback to USD if currency is invalid
    console.warn(`Invalid currency code: ${currency}, falling back to USD`);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  }
}

/**
 * Gets currency formatting options from user's country
 * @param userCountry - User's country object with currency field
 * @returns Currency formatting options
 */
export function getCurrencyOptions(userCountry?: { currency?: string | null }): CurrencyFormatterOptions {
  const currency = userCountry?.currency || 'USD';
  
  // You could extend this to include locale mapping based on country
  const locale = 'en-US'; // Default locale, could be enhanced based on country
  
  return {
    currency,
    locale,
  };
}

/**
 * Formats currency with user's preferred currency or fallback to USD
 * @param amount - Amount to format  
 * @param userCountry - User's country object
 * @returns Formatted currency string
 */
export function formatUserCurrency(
  amount: number,
  userCountry?: { currency?: string | null }
): string {
  const options = getCurrencyOptions(userCountry);
  return formatCurrency(amount, options);
}

/**
 * Common currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  CAD: '$',
  AUD: '$',
  CHF: 'Fr',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  RUB: '₽',
  BRL: 'R$',
  KRW: '₩',
  SGD: '$',
  HKD: '$',
  NZD: '$',
  ZAR: 'R',
  MXN: '$',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  TRY: '₺',
  ILS: '₪',
  AED: 'د.إ',
  SAR: '﷼',
  QAR: 'ر.ق',
  KWD: 'د.ك',
  BHD: '.د.ب',
  OMR: '﷼',
  JOD: 'د.ا',
  LBP: '£',
  EGP: '£',
  MAD: 'د.م.',
  TND: 'د.ت',
  DZD: 'د.ج',
  NGN: '₦',
  KES: 'KSh',
  GHS: '₵',
  UGX: 'USh',
  TZS: 'TSh',
  RWF: 'RF',
  ETB: 'Br',
  XAF: 'CFA',
  XOF: 'CFA',
};

/**
 * Gets currency symbol for a currency code
 * @param currencyCode - ISO 4217 currency code
 * @returns Currency symbol or code if symbol not found
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
}