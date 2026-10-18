package com.voltflow.dto;

import java.math.BigDecimal;

public record PrepaidPlanResponse(
    Long id,
    String name,
    String description,
    BigDecimal price,
    BigDecimal creditAmount,
    BigDecimal energyAllowanceKwh,
    Integer validityDays,
    String currency,
    Boolean active
) {}
