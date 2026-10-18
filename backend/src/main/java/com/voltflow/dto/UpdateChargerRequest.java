package com.voltflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateChargerRequest(
    @NotBlank(message = "Charger code is required")
    String chargerCode,

    @NotBlank(message = "Connector type is required")
    String connectorType,

    @NotNull(message = "Max power kW is required")
    @DecimalMin(value = "1.0", message = "Max power must be at least 1.0 kW")
    BigDecimal maxPowerKw,

    String status
) {}
