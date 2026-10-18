package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerPlanResponse(
    Long id,
    Long planId,
    String planName,
    String planDescription,
    BigDecimal purchasePrice,
    BigDecimal creditedAmount,
    BigDecimal remainingEnergyKwh,
    String status,
    String idempotencyKey,
    LocalDateTime purchasedAt,
    LocalDateTime expiresAt
) {}
