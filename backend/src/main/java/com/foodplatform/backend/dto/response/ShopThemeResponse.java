package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.ShopTheme;

import java.util.UUID;

public record ShopThemeResponse(
        UUID themeId,
        UUID shopId,
        String themeName,
        String primaryColor,
        String secondaryColor,
        String fontFamily,
        boolean showAbout,
        boolean showGallery,
        String layoutConfig
) {
    public static ShopThemeResponse from(ShopTheme t) {
        return new ShopThemeResponse(
                t.getThemeId(), t.getShop().getShopId(), t.getThemeName(),
                t.getPrimaryColor(), t.getSecondaryColor(), t.getFontFamily(),
                t.isShowAbout(), t.isShowGallery(), t.getLayoutConfig()
        );
    }
}
