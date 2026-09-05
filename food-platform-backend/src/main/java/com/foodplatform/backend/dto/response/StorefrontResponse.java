package com.foodplatform.backend.dto.response;

import java.util.List;

/**
 * Body of GET /api/v1/storefront/{slug}, matching StoreContext.jsx's loadShop():
 * res.data.shop and res.data.menu.
 */
public record StorefrontResponse(
        ShopFrontendResponse shop,
        List<MenuItemFrontendResponse> menu
) {}
