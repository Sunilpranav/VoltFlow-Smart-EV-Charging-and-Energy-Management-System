package com.voltflow.dto;

import jakarta.validation.constraints.NotNull;

public record StartSessionRequest(
    @NotNull(message = "Vehicle ID is required")
    Long vehicleId,

    @NotNull(message = "Charger ID is required")
    Long chargerId
) {}
