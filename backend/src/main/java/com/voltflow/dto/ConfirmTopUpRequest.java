package com.voltflow.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmTopUpRequest(
    @NotBlank(message = "Intent ID is required")
    String intentId,
    String action // SUCCEED, FAIL, CANCEL
) {}
