package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.InventoryTransaction;
import com.foodplatform.backend.entity.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, UUID> {
    List<InventoryTransaction> findByInventory_InventoryIdOrderByTransactionTimeDesc(UUID inventoryId);

    // Waste Management: pulls WASTAGE-type transactions for a shop over a date
    // range. Reuses the existing inventory_transactions table added for
    // Inventory Management - no new table needed to power waste analytics.
    List<InventoryTransaction> findByInventory_Shop_ShopIdAndTransactionTypeAndTransactionTimeBetween(
            UUID shopId, TransactionType transactionType, LocalDateTime from, LocalDateTime to);
}
