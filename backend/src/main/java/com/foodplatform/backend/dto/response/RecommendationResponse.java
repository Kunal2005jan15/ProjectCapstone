package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.enums.RecommendationType;

import java.math.BigDecimal;
import java.util.UUID;

public record RecommendationResponse(
        UUID itemId,
        String itemName,
        RecommendationType type,
        BigDecimal score,
        String reason
) {}
