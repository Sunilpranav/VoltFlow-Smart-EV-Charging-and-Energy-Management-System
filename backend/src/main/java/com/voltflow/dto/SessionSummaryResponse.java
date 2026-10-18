package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SessionSummaryResponse(
    Long sessionId,
    String status,
    String customerName,
    String customerEmail,
    String vehicleInfo,
    String stationName,
    String stationAddress,
    String chargerCode,
    String connectorType,
    LocalDateTime startTime,
    LocalDateTime stopTime,
    long durationSeconds,
    String durationFormatted,
    BigDecimal startMeterKwh,
    BigDecimal stopMeterKwh,
    BigDecimal energyConsumedKwh,
    BigDecimal tariffPerKwh,
    BigDecimal totalCost,
    String paymentStatus,
    String simulationNote
) {}
