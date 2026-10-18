package com.voltflow.dto;

import java.math.BigDecimal;
import java.util.List;

public record CustomerDashboardResponse(
    UserResponse profile,
    int vehicleCount,
    List<VehicleResponse> vehicles,
    long availableStationCount,
    List<StationSummaryResponse> recommendedStations,
    List<AuditLogResponse> recentActivity,
    BigDecimal totalEnergyConsumedKwh,
    BigDecimal totalSpend,
    int activeSessionCount,
    BigDecimal walletBalance
) {}
