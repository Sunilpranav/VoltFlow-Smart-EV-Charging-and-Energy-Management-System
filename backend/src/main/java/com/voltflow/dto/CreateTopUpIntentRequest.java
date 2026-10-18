package com.voltflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateTopUpIntentRequest(
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Minimum top-up amount is $1.00")
    BigDecimal amount,
    String idempotencyKey,
    String description
) {}
