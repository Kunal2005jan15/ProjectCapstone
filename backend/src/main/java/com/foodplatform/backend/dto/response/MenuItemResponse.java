package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.MenuItem;

import java.math.BigDecimal;
import java.util.UUID;

public record MenuItemResponse(
        UUID itemId,
        UUID shopId,
        UUID categoryId,
        String categoryName,
        String itemName,
        String description,
        BigDecimal price,
        String imageUrl,
        boolean isVegetarian,
        boolean isAvailable,
        Integer preparationTime
) {
    public static MenuItemResponse from(MenuItem m) {
        return new MenuItemResponse(
                m.getItemId(),
                m.getShop().getShopId(),
                m.getCategory() != null ? m.getCategory().getCategoryId() : null,
                m.getCategory() != null ? m.getCategory().getCategoryName() : null,
                m.getItemName(),
                m.getDescription(),
                m.getPrice(),
                m.getImageUrl(),
                m.isVegetarian(),
                m.isAvailable(),
                m.getPreparationTime()
        );
    }
}
