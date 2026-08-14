package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.MenuItem;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Shape matches MenuManagement.jsx (admin CRUD) and Storefront.jsx (customer menu):
 * item.id, item.name, item.description, item.price, item.category, item.active.
 */
public record MenuItemFrontendResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        String category,
        boolean active
) {
    public static MenuItemFrontendResponse from(MenuItem m) {
        return new MenuItemFrontendResponse(
                m.getItemId(),
                m.getItemName(),
                m.getDescription(),
                m.getPrice(),
                m.getCategory() != null ? m.getCategory().getCategoryName() : "Uncategorized",
                m.isAvailable()
        );
    }
}
