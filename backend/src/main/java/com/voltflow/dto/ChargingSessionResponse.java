package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ChargingSessionResponse(
    Long id,
    Long customerId,
    String customerEmail,
    String customerName,
    Long vehicleId,
    String vehicleMake,
    String vehicleModel,
    String vehicleRegistrationNumber,
    String connectorType,
    Long stationId,
    String stationName,
    String stationAddress,
    Long chargerId,
    String chargerCode,
    BigDecimal chargerMaxPowerKw,
    String status,
    LocalDateTime startTime,
    LocalDateTime stopTime,
    BigDecimal startMeterKwh,
    BigDecimal stopMeterKwh,
    BigDecimal energyConsumedKwh,
    BigDecimal tariffPerKwh,
    BigDecimal totalCost,
    String paymentStatus,
    String simulationNote,
    LocalDateTime createdAt
) {}
