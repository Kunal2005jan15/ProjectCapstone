package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record MenuItemRequest(
        @NotBlank String itemName,
        String description,
        UUID categoryId,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        BigDecimal costPrice,
        String imageUrl,
        Boolean isVegetarian,
        Boolean isAvailable,
        Integer preparationTime,
        // optional initial inventory setup
        BigDecimal initialStock,
        String stockUnit,
        BigDecimal reorderLevel,
        BigDecimal safetyStock
) {}
