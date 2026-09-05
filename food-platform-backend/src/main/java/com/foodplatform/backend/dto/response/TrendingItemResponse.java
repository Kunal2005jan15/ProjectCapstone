package com.foodplatform.backend.dto.response;

import java.util.UUID;

public record TrendingItemResponse(
        UUID itemId,
        String itemName,
        Long totalQuantitySold
) {}
