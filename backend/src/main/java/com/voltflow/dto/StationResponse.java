package com.voltflow.dto;

import java.time.LocalDateTime;
import java.util.List;

public record StationResponse(
    Long id,
    String name,
    String address,
    Double latitude,
    Double longitude,
    String status,
    int totalChargers,
    int availableChargers,
    List<ChargerResponse> chargers,
    LocalDateTime createdAt
) {}
