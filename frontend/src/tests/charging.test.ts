import { describe, it, expect } from 'vitest';

describe('EV Charging Calculations & Compatibility', () => {
  it('calculates continuous simulated energy based on power and elapsed hours', () => {
    const calculateEnergy = (powerKw: number, durationSeconds: number): number => {
      if (durationSeconds <= 0 || powerKw <= 0) return 0;
      const hours = durationSeconds / 3600;
      return Math.round(powerKw * hours * 10000) / 10000;
    };

    // 7.2 kW for 30 minutes (1800s) = 3.6 kWh
    expect(calculateEnergy(7.2, 1800)).toBe(3.6);

    // 50 kW for 1 hour (3600s) = 50.0 kWh
    expect(calculateEnergy(50.0, 3600)).toBe(50.0);

    // 150 kW for 15 minutes (900s) = 37.5 kWh
    expect(calculateEnergy(150.0, 900)).toBe(37.5);

    // Zero seconds = 0 kWh
    expect(calculateEnergy(50.0, 0)).toBe(0);
  });

  it('validates connector compatibility between EV and charger stall', () => {
    const isConnectorCompatible = (vehicleConnector: string, chargerConnector: string): boolean => {
      const v = vehicleConnector.trim().toLowerCase();
      const c = chargerConnector.trim().toLowerCase();
      return v === c;
    };

    expect(isConnectorCompatible('CCS2', 'CCS2')).toBe(true);
    expect(isConnectorCompatible('Type 2', 'Type 2')).toBe(true);
    expect(isConnectorCompatible('CCS2', 'CHAdeMO')).toBe(false);
    expect(isConnectorCompatible('Type 2', 'CCS2')).toBe(false);
  });

  it('calculates charging cost with tariff and standard currency precision', () => {
    const calculateCost = (energyKwh: number, tariffPerKwh: number): number => {
      if (energyKwh <= 0 || tariffPerKwh <= 0) return 0;
      const raw = energyKwh * tariffPerKwh;
      const rounded = Math.round(raw * 100) / 100;
      return rounded === 0 && raw > 0 ? 0.01 : rounded;
    };

    // 3.6 kWh at $0.35/kWh = $1.26
    expect(calculateCost(3.6, 0.35)).toBe(1.26);

    // Tiny consumption guarantees minimum 1 cent billing
    expect(calculateCost(0.005, 0.35)).toBe(0.01);

    // 0 kWh = $0.00
    expect(calculateCost(0, 0.35)).toBe(0);
  });

  it('formats session durations into clear human-readable strings', () => {
    const formatDuration = (totalSeconds: number): string => {
      const s = Math.max(0, Math.floor(totalSeconds));
      const hours = Math.floor(s / 3600);
      const minutes = Math.floor((s % 3600) / 60);
      const seconds = s % 60;

      if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
      } else {
        return `${seconds}s`;
      }
    };

    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(3665)).toBe('1h 01m 05s');
  });
});
