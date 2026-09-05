package com.foodplatform.backend.dto.response;

import java.util.Map;
import java.util.UUID;

/**
 * Shape matches what the React frontend reads off `shop` throughout the app
 * (StoreContext, Dashboard, Checkout, StoreCustomization, OnboardingTemplate, etc.):
 * shop.id, shop.name, shop.slug, shop.serviceType, shop.templateId, shop.theme.*
 */
public record ShopFrontendResponse(
        UUID id,
        String name,
        String slug,
        String serviceType,
        String templateId,
        String description,
        String logoUrl,
        String bannerUrl,
        Map<String, Object> theme
) {}
