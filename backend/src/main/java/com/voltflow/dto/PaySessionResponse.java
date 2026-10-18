package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaySessionResponse(
    Long sessionId,
    String paymentStatus,
    BigDecimal amountPaid,
    BigDecimal remainingWalletBalance,
    Long transactionId,
    String idempotencyKey,
    LocalDateTime paidAt
) {}
