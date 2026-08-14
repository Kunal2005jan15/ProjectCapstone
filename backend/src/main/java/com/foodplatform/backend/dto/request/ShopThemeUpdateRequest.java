package com.foodplatform.backend.dto.request;

import java.util.Map;

/**
 * Body of PUT /api/v1/shops/theme, exactly matching what StoreCustomization.jsx
 * and OnboardingTemplate.jsx send: { theme: {...free-form...}, templateId }.
 */
public record ShopThemeUpdateRequest(
        Map<String, Object> theme,
        String templateId
) {}
