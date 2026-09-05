package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.CustomerSession;

import java.util.UUID;

public record SessionResponse(
        UUID sessionId,
        UUID shopId,
        UUID customerId
) {
    public static SessionResponse from(CustomerSession s) {
        return new SessionResponse(
                s.getSessionId(),
                s.getShop().getShopId(),
                s.getCustomer() != null ? s.getCustomer().getCustomerId() : null
        );
    }
}
