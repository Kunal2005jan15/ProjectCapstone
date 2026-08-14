package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.entity.enums.ShopStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record ShopResponse(
        UUID shopId,
        UUID ownerId,
        String shopName,
        String description,
        String phone,
        String email,
        String address,
        String city,
        String state,
        String pincode,
        String cuisineType,
        String logoUrl,
        String bannerUrl,
        ShopStatus status,
        LocalDateTime createdAt
) {
    public static ShopResponse from(Shop shop) {
        return new ShopResponse(
                shop.getShopId(),
                shop.getOwner().getUserId(),
                shop.getShopName(),
                shop.getDescription(),
                shop.getPhone(),
                shop.getEmail(),
                shop.getAddress(),
                shop.getCity(),
                shop.getState(),
                shop.getPincode(),
                shop.getCuisineType(),
                shop.getLogoUrl(),
                shop.getBannerUrl(),
                shop.getStatus(),
                shop.getCreatedAt()
        );
    }
}
