package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.Order;
import com.foodplatform.backend.entity.OrderItem;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Shape matches OrderTracking.jsx and LiveQueue.jsx:
 * order.id, order.status, order.items[{id,name,qty,price}], order.totalAmount, order.minutesAgo.
 */
public record OrderFrontendResponse(
        UUID id,
        String status,
        List<Item> items,
        BigDecimal totalAmount,
        long minutesAgo
) {
    public record Item(UUID id, String name, Integer qty, BigDecimal price) {
        public static Item from(OrderItem oi) {
            return new Item(oi.getOrderItemId(), oi.getMenuItem().getItemName(), oi.getQuantity(), oi.getUnitPrice());
        }
    }

    public static OrderFrontendResponse from(Order o) {
        // orderTimestamp is a @CreationTimestamp field: it's only guaranteed to be
        // populated after Hibernate has flushed the INSERT. Guard against it still
        // being null instead of letting Duration.between throw a NullPointerException.
        long minutesAgo = o.getOrderTimestamp() == null
                ? 0
                : Duration.between(o.getOrderTimestamp(), LocalDateTime.now()).toMinutes();
        return new OrderFrontendResponse(
                o.getOrderId(),
                o.getOrderStatus().name(),
                o.getItems().stream().map(Item::from).collect(Collectors.toList()),
                o.getTotalAmount(),
                Math.max(minutesAgo, 0)
        );
    }
}