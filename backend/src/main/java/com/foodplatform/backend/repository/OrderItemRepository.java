package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findByOrder_OrderId(UUID orderId);

    @Query("""
        SELECT oi.menuItem.itemId AS itemId, oi.menuItem.itemName AS itemName, SUM(oi.quantity) AS totalQty
        FROM OrderItem oi
        WHERE oi.order.shop.shopId = :shopId
          AND oi.order.orderTimestamp >= :since
        GROUP BY oi.menuItem.itemId, oi.menuItem.itemName
        ORDER BY SUM(oi.quantity) DESC
        """)
    List<TrendingItemProjection> findTrendingItems(@Param("shopId") UUID shopId,
                                                    @Param("since") LocalDateTime since);

    @Query("""
        SELECT oi.menuItem.itemId AS itemId, oi.menuItem.itemName AS itemName, COUNT(DISTINCT oi.order.orderId) AS orderCount
        FROM OrderItem oi
        WHERE oi.order.customer.customerId = :customerId
        GROUP BY oi.menuItem.itemId, oi.menuItem.itemName
        ORDER BY COUNT(DISTINCT oi.order.orderId) DESC
        """)
    List<CustomerFrequencyProjection> findFrequentItemsForCustomer(@Param("customerId") UUID customerId);

    interface TrendingItemProjection {
        UUID getItemId();
        String getItemName();
        Long getTotalQty();
    }

    interface CustomerFrequencyProjection {
        UUID getItemId();
        String getItemName();
        Long getOrderCount();
    }
}
