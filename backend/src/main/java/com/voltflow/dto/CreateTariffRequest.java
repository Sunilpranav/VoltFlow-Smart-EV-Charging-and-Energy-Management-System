package com.voltflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateTariffRequest(
    @NotBlank(message = "Tariff name is required")
    String name,

    @NotNull(message = "Rate per kWh is required")
    @DecimalMin(value = "0.01", message = "Rate must be greater than zero")
    BigDecimal ratePerKwh,

    String connectorType, // null for default/fallback tariff

    String currency, // defaults to USD if not provided

    Boolean active
) {}
