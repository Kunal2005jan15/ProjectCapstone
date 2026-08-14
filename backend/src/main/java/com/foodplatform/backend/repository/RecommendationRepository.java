package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecommendationRepository extends JpaRepository<Recommendation, UUID> {
    List<Recommendation> findByShop_ShopIdAndCustomer_CustomerId(UUID shopId, UUID customerId);
    List<Recommendation> findByShop_ShopIdAndSession_SessionId(UUID shopId, UUID sessionId);
}
