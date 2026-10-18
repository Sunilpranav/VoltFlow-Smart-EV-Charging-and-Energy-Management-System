package com.voltflow.dto;

public record PurchasePlanRequest(
    String idempotencyKey
) {}
