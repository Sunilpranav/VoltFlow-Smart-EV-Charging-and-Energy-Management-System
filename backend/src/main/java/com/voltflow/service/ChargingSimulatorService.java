package com.voltflow.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;

@Service
public class ChargingSimulatorService {

    /**
     * Calculates simulated energy delivered in kWh based on charger power output and elapsed duration.
     * Uses constant power model: Energy (kWh) = Power (kW) * Duration (hours).
     * Sub-second durations are calculated using millisecond resolution.
     * Note: This is a deterministic simulation and does not interface with live OCPP EVSE hardware.
     */
    public BigDecimal calculateSimulatedEnergy(BigDecimal chargerPowerKw, Duration duration) {
        if (duration == null || duration.isNegative() || duration.isZero()) {
            return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        }

        BigDecimal power = (chargerPowerKw != null && chargerPowerKw.compareTo(BigDecimal.ZERO) > 0)
                ? chargerPowerKw
                : BigDecimal.valueOf(50.0);

        double hours = duration.toMillis() / 3_600_000.0;
        double calculatedEnergy = power.doubleValue() * hours;
        return BigDecimal.valueOf(calculatedEnergy).setScale(4, RoundingMode.HALF_UP);
    }

    /**
     * Calculates cost based on energy delivered and applicable tariff, rounded to standard 2 decimal places.
     * When electricity is consumed (>0 kWh) under a positive tariff, guarantees a minimum charge of $0.01.
     */
    public BigDecimal calculateCost(BigDecimal energyKwh, BigDecimal tariffPerKwh) {
        if (energyKwh == null || tariffPerKwh == null || energyKwh.compareTo(BigDecimal.ZERO) <= 0 || tariffPerKwh.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal rawCost = energyKwh.multiply(tariffPerKwh);
        BigDecimal rounded = rawCost.setScale(2, RoundingMode.HALF_UP);
        if (rounded.compareTo(BigDecimal.ZERO) == 0 && rawCost.compareTo(BigDecimal.ZERO) > 0) {
            return BigDecimal.valueOf(0.01);
        }
        return rounded;
    }

    /**
     * Formats duration in human-readable representation (e.g., "1h 15m 30s" or "45s").
     */
    public String formatDuration(Duration duration) {
        long totalSeconds = Math.max(duration.getSeconds(), 0);
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        if (hours > 0) {
            return String.format("%dh %02dm %02ds", hours, minutes, seconds);
        } else if (minutes > 0) {
            return String.format("%dm %02ds", minutes, seconds);
        } else {
            return String.format("%ds", seconds);
        }
    }
}
