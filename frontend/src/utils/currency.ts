/**
 * VoltFlow Standardized Currency & Energy Formatting Utilities
 *
 * All financial calculations in VoltFlow default to USD ($) per database schema (V4)
 * and backend entities (Wallet.java, PrepaidPlan.java).
 */

export const DEFAULT_CURRENCY = 'USD';
export const CURRENCY_SYMBOL = '$';

/**
 * Format a monetary amount into standard currency display ($XX.XX).
 * Correctly formats 0, negative values (-$XX.XX), and high decimals.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  _currency: string = DEFAULT_CURRENCY
): string {
  if (amount === null || amount === undefined) {
    return `${CURRENCY_SYMBOL}0.00`;
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return `${CURRENCY_SYMBOL}0.00`;
  }

  const isNegative = num < 0;
  const absVal = Math.abs(num);
  const formatted = absVal.toFixed(2);

  return isNegative ? `-${CURRENCY_SYMBOL}${formatted}` : `${CURRENCY_SYMBOL}${formatted}`;
}

/**
 * Format an electricity tariff rate ($X.XX / kWh or $X.XXXX / kWh).
 */
export function formatTariffRate(
  rate: number | string | null | undefined,
  precision: number = 2
): string {
  if (rate === null || rate === undefined) {
    return `${CURRENCY_SYMBOL}0.00 / kWh`;
  }

  const num = typeof rate === 'string' ? parseFloat(rate) : rate;
  if (isNaN(num)) {
    return `${CURRENCY_SYMBOL}0.00 / kWh`;
  }

  return `${CURRENCY_SYMBOL}${num.toFixed(precision)} / kWh`;
}

/**
 * Format delivered or consumed electrical energy in kilowatt-hours (kWh).
 */
export function formatEnergy(kwh: number | string | null | undefined): string {
  if (kwh === null || kwh === undefined) {
    return '0.00 kWh';
  }

  const num = typeof kwh === 'string' ? parseFloat(kwh) : kwh;
  if (isNaN(num)) {
    return '0.00 kWh';
  }

  return `${num.toFixed(2)} kWh`;
}

/**
 * Format electrical charging power in kilowatts (kW).
 */
export function formatPower(kw: number | string | null | undefined): string {
  if (kw === null || kw === undefined) {
    return '0.0 kW';
  }

  const num = typeof kw === 'string' ? parseFloat(kw) : kw;
  if (isNaN(num)) {
    return '0.0 kW';
  }

  return `${num.toFixed(1)} kW`;
}
