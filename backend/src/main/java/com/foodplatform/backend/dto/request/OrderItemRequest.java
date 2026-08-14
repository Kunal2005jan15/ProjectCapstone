package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record OrderItemRequest(
        @NotNull UUID itemId,
        @NotNull @Min(1) Integer quantity
) {}
