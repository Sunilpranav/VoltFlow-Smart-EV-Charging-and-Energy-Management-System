package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ChargerResponse(
    Long id,
    Long stationId,
    String chargerCode,
    String connectorType,
    BigDecimal maxPowerKw,
    String status,
    LocalDateTime createdAt
) {}
