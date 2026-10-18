package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TariffResponse(
    Long id,
    String name,
    BigDecimal ratePerKwh,
    String connectorType,
    String currency,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
