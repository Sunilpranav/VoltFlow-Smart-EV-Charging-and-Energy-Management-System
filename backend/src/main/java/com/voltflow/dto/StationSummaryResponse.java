package com.voltflow.dto;

public record StationSummaryResponse(
    Long id,
    String name,
    String address,
    Double latitude,
    Double longitude,
    String status,
    int totalChargers,
    int availableChargers
) {}
