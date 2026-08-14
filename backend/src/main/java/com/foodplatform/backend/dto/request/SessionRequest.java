package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SessionRequest(
        @NotNull UUID shopId,
        String customerPhone,
        String customerName,
        String deviceType
) {}
