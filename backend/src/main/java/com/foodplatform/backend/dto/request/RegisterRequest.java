package com.foodplatform.backend.dto.request;

import com.foodplatform.backend.entity.enums.ServiceType;
import jakarta.validation.constraints.*;

/**
 * Body of POST /api/v1/auth/register, matching Register.jsx exactly:
 * { shopName, email, password, serviceType }. Every registration through this
 * public endpoint creates a shop owner account plus their shop in one step -
 * there's no separate "create shop" call in the frontend.
 */
public record RegisterRequest(
        @NotBlank @Size(max = 150) String shopName,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        String phone,
        ServiceType serviceType
) {}
