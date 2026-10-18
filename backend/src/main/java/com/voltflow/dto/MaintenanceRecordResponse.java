package com.voltflow.dto;

import java.time.LocalDateTime;

public record MaintenanceRecordResponse(
    Long id,
    Long chargerId,
    String chargerCode,
    Long stationId,
    String stationName,
    String category,
    String description,
    String severity,
    String status,
    String reportedBy,
    String assignedTechnician,
    String resolutionNotes,
    LocalDateTime resolvedAt,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
