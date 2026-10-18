package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VehicleResponse(
    Long id,
    String make,
    String model,
    String registrationNumber,
    BigDecimal batteryCapacityKwh,
    String connectorType,
    Integer modelYear,
    String ownerEmail,
    LocalDateTime createdAt
) {}
