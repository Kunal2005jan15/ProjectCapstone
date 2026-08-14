package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.ShopTheme;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ShopThemeRepository extends JpaRepository<ShopTheme, UUID> {
    Optional<ShopTheme> findByShop_ShopId(UUID shopId);
}
