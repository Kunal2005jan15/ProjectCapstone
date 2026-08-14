package com.foodplatform.backend.dto.request;

import com.foodplatform.backend.entity.enums.TransactionType;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record InventoryTransactionRequest(
        @NotNull TransactionType transactionType,
        @NotNull BigDecimal quantity,
        String reason
) {}
