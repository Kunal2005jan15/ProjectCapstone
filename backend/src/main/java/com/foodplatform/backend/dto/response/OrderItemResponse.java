package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.OrderItem;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID orderItemId,
        UUID itemId,
        String itemName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal discount,
        BigDecimal totalPrice
) {
    public static OrderItemResponse from(OrderItem oi) {
        return new OrderItemResponse(
                oi.getOrderItemId(),
                oi.getMenuItem().getItemId(),
                oi.getMenuItem().getItemName(),
                oi.getQuantity(),
                oi.getUnitPrice(),
                oi.getDiscount(),
                oi.getTotalPrice()
        );
    }
}
