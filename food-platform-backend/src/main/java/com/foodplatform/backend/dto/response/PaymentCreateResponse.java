package com.foodplatform.backend.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Shape matches Checkout.jsx's Razorpay handoff:
 * { razorpayKeyId, amount, razorpayOrderId }, plus a "mock" flag so the
 * frontend can skip the real Razorpay widget when online payment isn't
 * available (either app.payment.provider=off, or provider=razorpay with no
 * live keys configured yet). "provider" mirrors app.payment.provider so the
 * frontend can show provider-specific messaging if needed.
 */
public record PaymentCreateResponse(
        String razorpayKeyId,
        BigDecimal amount,
        String razorpayOrderId,
        UUID orderId,
        boolean mock,
        String provider
) {}
