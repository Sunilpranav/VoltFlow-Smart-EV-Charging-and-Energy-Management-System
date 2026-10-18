package com.voltflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank String fullName,
    @Email @NotBlank String email,
    @NotBlank @Size(min = 8) String password,
    String phone
) {}
