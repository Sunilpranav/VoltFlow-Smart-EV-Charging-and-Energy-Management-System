package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletTransactionResponse(
    Long id,
    Long walletId,
    String transactionType,
    BigDecimal amount,
    BigDecimal balanceAfter,
    String currency,
    String status,
    String description,
    String referenceId,
    Long sessionId,
    String idempotencyKey,
    LocalDateTime createdAt
) {}
