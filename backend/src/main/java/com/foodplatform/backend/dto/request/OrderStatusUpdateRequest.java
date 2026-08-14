package com.foodplatform.backend.dto.request;

import com.foodplatform.backend.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

/** Body of PATCH /api/v1/orders/{id}/status, matching LiveQueue.jsx: { status }. */
public record OrderStatusUpdateRequest(
        @NotNull OrderStatus status
) {}
