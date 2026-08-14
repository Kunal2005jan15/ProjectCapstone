package com.foodplatform.backend.dto.request;

import com.foodplatform.backend.entity.enums.OrderType;
import com.foodplatform.backend.entity.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record OrderRequest(
        @NotNull UUID shopId,
        UUID sessionId,          // present for no-login QR ordering
        UUID customerId,         // present when the customer is identified (phone/login)
        OrderType orderType,
        String tableNumber,
        PaymentMethod paymentMethod,
        @NotEmpty @Valid List<OrderItemRequest> items
) {}
