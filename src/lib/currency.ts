// Bimonetary currency management for Frenyer ERP

const DEFAULT_EXCHANGE_RATE = 877.90;
const RATE_STORAGE_KEY = 'frenyer_bcv_rate';
const ALT_RATE_STORAGE_KEY = 'frenyer_active_exchange_rate';

export function getActiveExchangeRate(): number {
  if (typeof window === 'undefined') return DEFAULT_EXCHANGE_RATE;
  const stored = localStorage.getItem(RATE_STORAGE_KEY) || localStorage.getItem(ALT_RATE_STORAGE_KEY);
  if (stored) {
    const parsed = parseFloat(stored);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_EXCHANGE_RATE;
}

export function setActiveExchangeRate(rate: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RATE_STORAGE_KEY, rate.toString());
  localStorage.setItem(ALT_RATE_STORAGE_KEY, rate.toString());
  window.dispatchEvent(new CustomEvent('frenyer:rate-changed', { detail: { rate } }));
}

/**
 * Converts a base USD amount to Venezuelan Bolívares (VES) using the current rate
 */
export function convertUSDtoVES(amountUSD: number, customRate?: number): number {
  const rate = customRate !== undefined ? customRate : getActiveExchangeRate();
  // Strictly round to 2 decimal places to avoid cent discrepancies in accounting
  return Math.round((amountUSD * rate) * 100) / 100;
}

/**
 * Converts a VES payment amount back to USD using the current rate
 */
export function convertVEStoUSD(amountVES: number, customRate?: number): number {
  const rate = customRate !== undefined ? customRate : getActiveExchangeRate();
  if (rate <= 0) return 0;
  return Math.round((amountVES / rate) * 100) / 100;
}

/**
 * Formats a USD amount as standard currency string ($ 10.00 / USD 10.00)
 */
export function formatUSD(amount: number, prefix: string = 'USD '): string {
  return `${prefix}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a Bolívares (VES) amount as standard currency string (Bs. 8.713,70)
 */
export function formatVES(amount: number, prefix: string = 'Bs. '): string {
  return `${prefix}${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isFutureRateTime(referenceDate: Date = new Date()): boolean {
  // Caracas is UTC-4
  const utcHours = referenceDate.getUTCHours();
  const caracasHour = (utcHours - 4 + 24) % 24;
  return caracasHour >= 16;
}

export function isFutureExchangeRate(): boolean {
  if (typeof window === 'undefined') return isFutureRateTime();
  const stored = localStorage.getItem('frenyer_bcv_is_future');
  if (stored !== null) return stored === 'true';
  return isFutureRateTime();
}

