package com.foodplatform.backend.dto.request;

public record ShopThemeRequest(
        String themeName,
        String primaryColor,
        String secondaryColor,
        String fontFamily,
        Boolean showAbout,
        Boolean showGallery,
        String layoutConfig
) {}
