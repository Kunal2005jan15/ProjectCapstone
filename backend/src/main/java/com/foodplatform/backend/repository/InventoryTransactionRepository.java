package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, UUID> {
    List<InventoryTransaction> findByInventory_InventoryIdOrderByTransactionTimeDesc(UUID inventoryId);
}
