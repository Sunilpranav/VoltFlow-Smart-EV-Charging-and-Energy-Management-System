package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentIntentResponse(
    String intentId,
    BigDecimal amount,
    String currency,
    String status,
    String paymentMethod,
    String idempotencyKey,
    String description,
    LocalDateTime confirmedAt,
    LocalDateTime createdAt,
    boolean sandboxMode
) {}
