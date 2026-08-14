package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByShop_ShopId(UUID shopId);
    List<MenuItem> findByShop_ShopIdAndIsAvailableTrue(UUID shopId);
    List<MenuItem> findByCategory_CategoryId(UUID categoryId);
}
