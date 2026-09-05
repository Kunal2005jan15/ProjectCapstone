package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, UUID> {
    List<RestaurantTable> findByShop_ShopIdOrderByTableNumberAsc(UUID shopId);
}
