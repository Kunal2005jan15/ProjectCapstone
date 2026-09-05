package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.InventoryTransaction;
import com.foodplatform.backend.entity.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record InventoryTransactionResponse(
        UUID transactionId,
        UUID inventoryId,
        TransactionType transactionType,
        BigDecimal quantity,
        LocalDateTime transactionTime,
        String reason
) {
    public static InventoryTransactionResponse from(InventoryTransaction t) {
        return new InventoryTransactionResponse(
                t.getTransactionId(), t.getInventory().getInventoryId(), t.getTransactionType(),
                t.getQuantity(), t.getTransactionTime(), t.getReason()
        );
    }
}
