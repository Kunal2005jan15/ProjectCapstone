package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.Order;
import com.foodplatform.backend.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    Page<Order> findByShop_ShopIdOrderByOrderTimestampDesc(UUID shopId, Pageable pageable);
    List<Order> findByShop_ShopIdOrderByOrderTimestampDesc(UUID shopId);
    List<Order> findByCustomer_CustomerIdOrderByOrderTimestampDesc(UUID customerId);
    List<Order> findByShop_ShopIdAndOrderTimestampBetween(UUID shopId, LocalDateTime from, LocalDateTime to);
    List<Order> findByShop_ShopIdAndOrderStatusInOrderByOrderTimestampAsc(UUID shopId, List<OrderStatus> statuses);
    // Used by the live queue: recent orders regardless of status, so a just-completed
    // order stays visible in the "Completed" column instead of vanishing immediately.
    List<Order> findByShop_ShopIdAndOrderTimestampAfterOrderByOrderTimestampAsc(UUID shopId, LocalDateTime after);
    long countByShop_ShopIdAndOrderStatusIn(UUID shopId, List<OrderStatus> statuses);
    long countByShop_ShopIdAndOrderTimestampBetween(UUID shopId, LocalDateTime from, LocalDateTime to);
    long countByShop_ShopId(UUID shopId);
}
