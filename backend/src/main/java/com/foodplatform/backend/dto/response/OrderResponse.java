package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.Order;
import com.foodplatform.backend.entity.enums.OrderStatus;
import com.foodplatform.backend.entity.enums.OrderType;
import com.foodplatform.backend.entity.enums.PaymentMethod;
import com.foodplatform.backend.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record OrderResponse(
        UUID orderId,
        UUID shopId,
        UUID customerId,
        UUID sessionId,
        LocalDateTime orderTimestamp,
        OrderStatus orderStatus,
        OrderType orderType,
        String tableNumber,
        BigDecimal subtotal,
        BigDecimal tax,
        BigDecimal discount,
        BigDecimal totalAmount,
        PaymentStatus paymentStatus,
        PaymentMethod paymentMethod,
        List<OrderItemResponse> items
) {
    public static OrderResponse from(Order o) {
        return new OrderResponse(
                o.getOrderId(),
                o.getShop().getShopId(),
                o.getCustomer() != null ? o.getCustomer().getCustomerId() : null,
                o.getSession() != null ? o.getSession().getSessionId() : null,
                o.getOrderTimestamp(),
                o.getOrderStatus(),
                o.getOrderType(),
                o.getTableNumber(),
                o.getSubtotal(),
                o.getTax(),
                o.getDiscount(),
                o.getTotalAmount(),
                o.getPaymentStatus(),
                o.getPaymentMethod(),
                o.getItems().stream().map(OrderItemResponse::from).collect(Collectors.toList())
        );
    }
}
