package com.voltflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateStationRequest(
    @NotBlank(message = "Station name is required")
    @Size(max = 255)
    String name,

    @NotBlank(message = "Address is required")
    @Size(max = 500)
    String address,

    Double latitude,
    Double longitude,

    String status
) {}
