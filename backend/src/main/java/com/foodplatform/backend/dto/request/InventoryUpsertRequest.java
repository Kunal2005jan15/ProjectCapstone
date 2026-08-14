package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record InventoryUpsertRequest(
        @NotNull UUID itemId,
        @NotNull BigDecimal currentStock,
        String unit,
        BigDecimal reorderLevel,
        BigDecimal safetyStock
) {}
