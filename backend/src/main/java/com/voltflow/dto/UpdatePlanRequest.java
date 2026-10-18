package com.voltflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdatePlanRequest(
    @NotBlank(message = "Plan name is required")
    String name,

    @NotBlank(message = "Plan description is required")
    String description,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    BigDecimal price,

    @NotNull(message = "Credit amount is required")
    @DecimalMin(value = "0.01", message = "Credit amount must be greater than zero")
    BigDecimal creditAmount,

    BigDecimal energyAllowanceKwh,

    @NotNull(message = "Validity days is required")
    @Min(value = 1, message = "Validity must be at least 1 day")
    Integer validityDays,

    String currency,

    Boolean active
) {}
