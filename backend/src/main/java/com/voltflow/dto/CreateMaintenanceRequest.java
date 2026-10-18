package com.voltflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateMaintenanceRequest(
    @NotNull(message = "Charger ID is required")
    Long chargerId,

    @NotBlank(message = "Category is required")
    String category, // HARDWARE, SOFTWARE, ELECTRICAL, PHYSICAL_DAMAGE, ROUTINE, OTHER

    @NotBlank(message = "Description is required")
    String description,

    @NotBlank(message = "Severity is required")
    String severity, // LOW, MEDIUM, HIGH, CRITICAL

    String reportedBy,

    String assignedTechnician
) {}
