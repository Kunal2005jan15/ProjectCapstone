package com.foodplatform.backend.dto.response;

import java.util.UUID;

public record PaymentVerifyResponse(
        String status,
        UUID orderId
) {}
