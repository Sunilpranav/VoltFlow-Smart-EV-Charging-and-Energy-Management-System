package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletResponse(
    Long walletId,
    Long userId,
    String userEmail,
    BigDecimal balance,
    String currency,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
