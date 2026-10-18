package com.voltflow.dto;

public record UserResponse(
    Long id,
    String fullName,
    String email,
    String phone,
    String role
) {}
