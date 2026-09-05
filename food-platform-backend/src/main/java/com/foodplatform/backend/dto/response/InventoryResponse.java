package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.Inventory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record InventoryResponse(
        UUID inventoryId,
        UUID shopId,
        UUID itemId,
        String itemName,
        BigDecimal currentStock,
        String unit,
        BigDecimal reorderLevel,
        BigDecimal safetyStock,
        boolean lowStock,
        LocalDateTime lastUpdated
) {
    public static InventoryResponse from(Inventory inv) {
        boolean low = inv.getCurrentStock().compareTo(inv.getReorderLevel()) <= 0;
        return new InventoryResponse(
                inv.getInventoryId(),
                inv.getShop().getShopId(),
                inv.getMenuItem().getItemId(),
                inv.getMenuItem().getItemName(),
                inv.getCurrentStock(),
                inv.getUnit(),
                inv.getReorderLevel(),
                inv.getSafetyStock(),
                low,
                inv.getLastUpdated()
        );
    }
}
