package com.voltflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public record AnalyticsSummaryResponse(
    LocalDateTime startDate,
    LocalDateTime endDate,
    BigDecimal totalRevenue,
    BigDecimal totalEnergyKwh,
    long totalSessions,
    long completedSessions,
    long activeSessions,
    long cancelledSessions,
    long successfulTopUpsCount,
    BigDecimal successfulTopUpsAmount,
    long refundsCount,
    BigDecimal refundsAmount,
    Map<String, Long> sessionsByStatus,
    Map<String, Long> chargersByStatus
) {}
