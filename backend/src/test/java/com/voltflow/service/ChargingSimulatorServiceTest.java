package com.voltflow.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class ChargingSimulatorServiceTest {

    private ChargingSimulatorService simulatorService;

    @BeforeEach
    void setUp() {
        simulatorService = new ChargingSimulatorService();
    }

    @Test
    @DisplayName("7.2 kW charger for 30 minutes delivers exactly 3.6000 kWh")
    void calculateSimulatedEnergy_level2_thirtyMinutes() {
        BigDecimal power = BigDecimal.valueOf(7.2);
        Duration duration = Duration.ofMinutes(30);

        BigDecimal energy = simulatorService.calculateSimulatedEnergy(power, duration);

        assertThat(energy).isEqualByComparingTo(BigDecimal.valueOf(3.6000));
    }

    @Test
    @DisplayName("50.0 kW DC charger for 60 minutes delivers exactly 50.0000 kWh")
    void calculateSimulatedEnergy_dcFast_oneHour() {
        BigDecimal power = BigDecimal.valueOf(50.0);
        Duration duration = Duration.ofHours(1);

        BigDecimal energy = simulatorService.calculateSimulatedEnergy(power, duration);

        assertThat(energy).isEqualByComparingTo(BigDecimal.valueOf(50.0000));
    }

    @Test
    @DisplayName("150.0 kW Ultra-Fast charger for 15 minutes delivers exactly 37.5000 kWh")
    void calculateSimulatedEnergy_ultraFast_fifteenMinutes() {
        BigDecimal power = BigDecimal.valueOf(150.0);
        Duration duration = Duration.ofMinutes(15);

        BigDecimal energy = simulatorService.calculateSimulatedEnergy(power, duration);

        assertThat(energy).isEqualByComparingTo(BigDecimal.valueOf(37.5000));
    }

    @Test
    @DisplayName("Zero duration delivers 0.0000 kWh without artificial baseline")
    void calculateSimulatedEnergy_zeroDuration() {
        BigDecimal power = BigDecimal.valueOf(50.0);
        Duration duration = Duration.ZERO;

        BigDecimal energy = simulatorService.calculateSimulatedEnergy(power, duration);

        assertThat(energy).isEqualByComparingTo(BigDecimal.valueOf(0.0000));
    }

    @Test
    @DisplayName("Negative duration delivers 0.0000 kWh safely")
    void calculateSimulatedEnergy_negativeDuration() {
        BigDecimal power = BigDecimal.valueOf(50.0);
        Duration duration = Duration.ofSeconds(-10);

        BigDecimal energy = simulatorService.calculateSimulatedEnergy(power, duration);

        assertThat(energy).isEqualByComparingTo(BigDecimal.valueOf(0.0000));
    }

    @Test
    @DisplayName("Sub-second duration delivers proportional non-zero energy")
    void calculateSimulatedEnergy_subSecond() {
        BigDecimal power = BigDecimal.valueOf(50.0);
        Duration duration = Duration.ofMillis(500); // 0.5 seconds

        BigDecimal energy = simulatorService.calculateSimulatedEnergy(power, duration);

        assertThat(energy).isGreaterThan(BigDecimal.ZERO);
        assertThat(energy).isLessThan(BigDecimal.valueOf(0.0100));
    }

    @Test
    @DisplayName("Cost calculation correctly multiplies energy and tariff with 2 decimal places")
    void calculateCost_standard() {
        BigDecimal energy = BigDecimal.valueOf(3.6000);
        BigDecimal tariff = BigDecimal.valueOf(0.3500);

        BigDecimal cost = simulatorService.calculateCost(energy, tariff);

        assertThat(cost).isEqualByComparingTo(BigDecimal.valueOf(1.26));
    }

    @Test
    @DisplayName("Cost calculation provides minimum $0.01 charge when energy was dispensed")
    void calculateCost_subCentMinimum() {
        BigDecimal energy = BigDecimal.valueOf(0.0005); // Tiny sub-cent energy
        BigDecimal tariff = BigDecimal.valueOf(0.3500);

        BigDecimal cost = simulatorService.calculateCost(energy, tariff);

        assertThat(cost).isEqualByComparingTo(BigDecimal.valueOf(0.01));
    }

    @Test
    @DisplayName("Zero energy results in $0.00 charge")
    void calculateCost_zeroEnergy() {
        BigDecimal energy = BigDecimal.ZERO;
        BigDecimal tariff = BigDecimal.valueOf(0.3500);

        BigDecimal cost = simulatorService.calculateCost(energy, tariff);

        assertThat(cost).isEqualByComparingTo(BigDecimal.valueOf(0.00));
    }

    @Test
    @DisplayName("Format duration formats hours, minutes, and seconds properly")
    void formatDuration() {
        assertThat(simulatorService.formatDuration(Duration.ofSeconds(45))).isEqualTo("45s");
        assertThat(simulatorService.formatDuration(Duration.ofMinutes(15))).isEqualTo("15m 00s");
        assertThat(simulatorService.formatDuration(Duration.ofSeconds(3665))).isEqualTo("1h 01m 05s");
    }
}
