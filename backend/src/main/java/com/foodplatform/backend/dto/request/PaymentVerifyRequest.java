package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** Body of POST /api/v1/payments/verify, matching Checkout.jsx's Razorpay handler callback. */
public record PaymentVerifyRequest(
        @NotNull UUID orderId,
        String razorpay_payment_id,
        String razorpay_order_id,
        String razorpay_signature
) {}
