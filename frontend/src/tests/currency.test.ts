import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatTariffRate,
  formatEnergy,
  formatPower,
} from '../utils/currency';

describe('VoltFlow Currency & Unit Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('formats standard positive monetary amounts', () => {
      expect(formatCurrency(25)).toBe('$25.00');
      expect(formatCurrency(10.5)).toBe('$10.50');
      expect(formatCurrency(0.99)).toBe('$0.99');
      expect(formatCurrency(1234.56)).toBe('$1234.56');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(0.0)).toBe('$0.00');
      expect(formatCurrency(-0)).toBe('$0.00');
    });

    it('formats negative amounts with a leading minus sign before currency symbol', () => {
      expect(formatCurrency(-15.5)).toBe('-$15.50');
      expect(formatCurrency(-0.01)).toBe('-$0.01');
      expect(formatCurrency(-100)).toBe('-$100.00');
    });

    it('handles numeric string inputs and decimal rounding', () => {
      expect(formatCurrency('49.99')).toBe('$49.99');
      expect(formatCurrency('12.3456')).toBe('$12.35');
      expect(formatCurrency('-25.50')).toBe('-$25.50');
    });

    it('safely handles null, undefined, and NaN inputs', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
      expect(formatCurrency('invalid-amount')).toBe('$0.00');
    });
  });

  describe('formatTariffRate', () => {
    it('formats standard tariff rates per kWh', () => {
      expect(formatTariffRate(0.35)).toBe('$0.35 / kWh');
      expect(formatTariffRate(0.22)).toBe('$0.22 / kWh');
      expect(formatTariffRate(0.28)).toBe('$0.28 / kWh');
    });

    it('supports 4 decimal place precision when specified', () => {
      expect(formatTariffRate(0.3500, 4)).toBe('$0.3500 / kWh');
      expect(formatTariffRate('0.2250', 4)).toBe('$0.2250 / kWh');
    });

    it('safely handles null and undefined rates', () => {
      expect(formatTariffRate(null)).toBe('$0.00 / kWh');
      expect(formatTariffRate(undefined)).toBe('$0.00 / kWh');
    });
  });

  describe('formatEnergy', () => {
    it('formats kWh values with two decimal places', () => {
      expect(formatEnergy(24.5)).toBe('24.50 kWh');
      expect(formatEnergy(0)).toBe('0.00 kWh');
      expect(formatEnergy('50.123')).toBe('50.12 kWh');
      expect(formatEnergy(null)).toBe('0.00 kWh');
    });
  });

  describe('formatPower', () => {
    it('formats power values in kW with single decimal precision', () => {
      expect(formatPower(50)).toBe('50.0 kW');
      expect(formatPower(7.2)).toBe('7.2 kW');
      expect(formatPower(150.0)).toBe('150.0 kW');
      expect(formatPower(null)).toBe('0.0 kW');
    });
  });
});
