package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.Category;

import java.util.UUID;

public record CategoryResponse(
        UUID categoryId,
        UUID shopId,
        String categoryName,
        String description,
        Integer displayOrder,
        boolean isActive
) {
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(
                c.getCategoryId(), c.getShop().getShopId(), c.getCategoryName(),
                c.getDescription(), c.getDisplayOrder(), c.isActive()
        );
    }
}
