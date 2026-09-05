package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/** Body of POST /api/v1/payments/create, matching Checkout.jsx: { orderId, amount }. */
public record PaymentCreateRequest(
        @NotNull UUID orderId,
        @NotNull BigDecimal amount
) {}
