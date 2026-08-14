package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<Inventory, UUID> {
    List<Inventory> findByShop_ShopId(UUID shopId);
    Optional<Inventory> findByMenuItem_ItemId(UUID itemId);

    // Low-stock alert: current_stock below reorder_level
    List<Inventory> findByShop_ShopIdAndCurrentStockLessThanEqual(UUID shopId, java.math.BigDecimal threshold);
}
