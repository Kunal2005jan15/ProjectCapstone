package com.foodplatform.backend.dto.response;

/**
 * Body of GET /api/v1/payments/config. Lets the frontend (Checkout.jsx) show
 * "Payment Off" messaging up front, before the customer even taps pay.
 */
public record PaymentConfigResponse(
        String provider,
        boolean paymentEnabled
) {}
