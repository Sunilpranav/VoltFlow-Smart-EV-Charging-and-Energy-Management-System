package com.voltflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AdminRefundRequest(
    Long sessionId,
    @Size(max = 255)
    String reason,
    @DecimalMin(value = "0.01", message = "Refund amount must be greater than zero")
    BigDecimal amount
) {
    public AdminRefundRequest(String reason) {
        this(null, reason, null);
    }

    public AdminRefundRequest(Long sessionId, String reason) {
        this(sessionId, reason, null);
    }
}
