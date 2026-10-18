package com.voltflow.dto;

import java.math.BigDecimal;

public record AdminDashboardResponse(
    String status,
    long customerCount,
    long vehicleCount,
    long stationCount,
    long chargerCount,
    long availableChargers,
    long occupiedChargers,
    long maintenanceChargers,
    long activeSessions,
    long completedSessions,
    BigDecimal totalEnergyKwh,
    BigDecimal paidRevenue,
    BigDecimal unpaidRevenue,
    long successfulTopUpsCount,
    BigDecimal successfulTopUpsAmount,
    long refundsCount,
    BigDecimal refundsAmount,
    long planPurchasesCount,
    BigDecimal planPurchasesAmount
) {}
