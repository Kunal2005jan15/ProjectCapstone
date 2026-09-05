package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ShopRequest(
        @NotBlank @Size(max = 150) String shopName,
        String description,
        String phone,
        String email,
        String address,
        String city,
        String state,
        String pincode,
        String cuisineType,
        String logoUrl,
        String bannerUrl
) {}
