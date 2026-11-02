import { getCurrency } from './currency';
import type { Money } from './types';

/** Upper bound for any single amount, keeps arithmetic safe and inputs sane. */
export const MAX_MONEY: Money = 9_999_999_999;
/** 100% in basis points. */
export const MAX_BPS = 10_000;

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatMoney(
  amount: Money,
  currencyCode: string,
  options: { symbol?: boolean; signed?: boolean } = {},
): string {
  const { symbol = true, signed = false } = options;
  const { decimals, symbol: sym } = getCurrency(currencyCode);
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const factor = 10 ** decimals;
  const whole = Math.floor(abs / factor);
  const frac = abs % factor;
  let out = groupThousands(String(whole));
  if (decimals > 0) out += '.' + String(frac).padStart(decimals, '0');
  if (symbol) out = sym + out;
  if (negative) return '−' + out;
  return signed && amount > 0 ? '+' + out : out;
}

/**
 * Parses user-typed text such as "1,250.5" into minor units.
 * Returns null when the text isn't a valid amount for the currency.
 */
export function parseMoney(text: string, decimals: number): Money | null {
  const cleaned = text.replace(/[,\s]/g, '');
  if (cleaned === '') return 0;
  const pattern = decimals > 0 ? /^\d*\.?\d*$/ : /^\d+$/;
  if (!pattern.test(cleaned) || cleaned === '.') return null;
  const [whole = '', frac = ''] = cleaned.split('.');
  if (frac.length > decimals) return null;
  const minor = Number(whole || '0') * 10 ** decimals + Number(frac.padEnd(decimals, '0') || '0');
  if (!Number.isFinite(minor) || minor > MAX_MONEY) return null;
  return minor;
}

/** Text to show in an input for an existing amount (no grouping, trims zeros). */
export function moneyToInputText(amount: Money, decimals: number): string {
  if (amount === 0) return '';
  const factor = 10 ** decimals;
  const whole = Math.floor(amount / factor);
  const frac = amount % factor;
  if (decimals === 0 || frac === 0) return String(whole);
  return `${whole}.${String(frac).padStart(decimals, '0').replace(/0+$/, '')}`;
}

/** Basis points -> "12%" / "12.5%" / "12.25%". */
export function formatPercent(bps: number): string {
  const whole = Math.floor(bps / 100);
  const frac = bps % 100;
  if (frac === 0) return `${whole}%`;
  return `${whole}.${String(frac).padStart(2, '0').replace(/0+$/, '')}%`;
}

/** "12.5" -> 1250 bps. Null if invalid or above 100%. */
export function parsePercent(text: string): number | null {
  const cleaned = text.replace(/\s/g, '');
  if (cleaned === '') return 0;
  if (!/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '.') return null;
  const [whole = '', frac = ''] = cleaned.split('.');
  const bps = Number(whole || '0') * 100 + Number(frac.padEnd(2, '0') || '0');
  return bps > MAX_BPS ? null : bps;
}

export function percentToInputText(bps: number): string {
  if (bps === 0) return '';
  const whole = Math.floor(bps / 100);
  const frac = bps % 100;
  if (frac === 0) return String(whole);
  return `${whole}.${String(frac).padStart(2, '0').replace(/0+$/, '')}`;
}

/** amount * bps / 10000, rounded half up. */
export function percentOf(amount: Money, bps: number): Money {
  return Math.round((amount * bps) / MAX_BPS);
}
