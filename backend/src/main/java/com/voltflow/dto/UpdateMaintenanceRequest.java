package com.voltflow.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateMaintenanceRequest(
    String category,
    String description,
    String severity,
    @NotBlank(message = "Status is required")
    String status, // REPORTED, IN_PROGRESS, RESOLVED, CANCELLED
    String assignedTechnician,
    String resolutionNotes
) {}
