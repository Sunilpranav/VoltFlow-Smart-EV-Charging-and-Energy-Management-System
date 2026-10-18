package com.voltflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record VehicleRequest(
    @NotBlank(message = "Make is required")
    String make,

    @NotBlank(message = "Model is required")
    String model,

    @NotBlank(message = "Registration number is required")
    String registrationNumber,

    @NotNull(message = "Battery capacity is required")
    @Positive(message = "Battery capacity must be greater than 0")
    BigDecimal batteryCapacityKwh,

    @NotBlank(message = "Connector type is required")
    String connectorType,

    Integer modelYear
) {}
