package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.entity.enums.ShopStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShopRepository extends JpaRepository<Shop, UUID> {
    List<Shop> findByOwner_UserId(UUID ownerId);
    List<Shop> findByStatus(ShopStatus status);
    Optional<Shop> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
