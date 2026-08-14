package com.foodplatform.backend.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Shape matches Checkout.jsx's Razorpay handoff:
 * { razorpayKeyId, amount, razorpayOrderId }, plus a "mock" flag so the
 * frontend can skip the real Razorpay widget when no live keys are configured.
 */
public record PaymentCreateResponse(
        String razorpayKeyId,
        BigDecimal amount,
        String razorpayOrderId,
        UUID orderId,
        boolean mock
) {}
