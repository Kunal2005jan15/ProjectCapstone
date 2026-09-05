package com.foodplatform.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodplatform.backend.dto.request.ShopRequest;
import com.foodplatform.backend.dto.request.ShopThemeRequest;
import com.foodplatform.backend.dto.request.ShopThemeUpdateRequest;
import com.foodplatform.backend.dto.response.ShopFrontendResponse;
import com.foodplatform.backend.dto.response.ShopResponse;
import com.foodplatform.backend.dto.response.ShopThemeResponse;
import com.foodplatform.backend.dto.response.StorefrontResponse;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.entity.ShopTheme;
import com.foodplatform.backend.entity.User;
import com.foodplatform.backend.entity.enums.ShopStatus;
import com.foodplatform.backend.exception.ResourceNotFoundException;
import com.foodplatform.backend.repository.MenuItemRepository;
import com.foodplatform.backend.repository.ShopRepository;
import com.foodplatform.backend.repository.ShopThemeRepository;
import com.foodplatform.backend.repository.UserRepository;
import com.foodplatform.backend.dto.response.MenuItemFrontendResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;
    private final ShopThemeRepository shopThemeRepository;
    private final UserRepository userRepository;
    private final MenuItemRepository menuItemRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public ShopResponse createShop(UUID ownerId, ShopRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + ownerId));

        Shop shop = Shop.builder()
                .owner(owner)
                .shopName(request.shopName())
                .description(request.description())
                .phone(request.phone())
                .email(request.email())
                .address(request.address())
                .city(request.city())
                .state(request.state())
                .pincode(request.pincode())
                .cuisineType(request.cuisineType())
                .logoUrl(request.logoUrl())
                .bannerUrl(request.bannerUrl())
                .status(ShopStatus.PENDING)
                .build();

        shop = shopRepository.save(shop);

        // Every shop gets a default theme it can customize later.
        ShopTheme theme = ShopTheme.builder()
                .shop(shop)
                .themeName("default")
                .primaryColor("#3B6EA5")
                .secondaryColor("#F6F8FA")
                .fontFamily("Inter")
                .showAbout(true)
                .showGallery(true)
                .build();
        shopThemeRepository.save(theme);

        return ShopResponse.from(shop);
    }

    @Transactional(readOnly = true)
    public ShopResponse getShop(UUID shopId) {
        return ShopResponse.from(findShopOrThrow(shopId));
    }

    @Transactional(readOnly = true)
    public List<ShopResponse> getShopsByOwner(UUID ownerId) {
        return shopRepository.findByOwner_UserId(ownerId).stream().map(ShopResponse::from).toList();
    }

    @Transactional
    public ShopResponse updateShop(UUID shopId, ShopRequest request) {
        Shop shop = findShopOrThrow(shopId);
        shop.setShopName(request.shopName());
        shop.setDescription(request.description());
        shop.setPhone(request.phone());
        shop.setEmail(request.email());
        shop.setAddress(request.address());
        shop.setCity(request.city());
        shop.setState(request.state());
        shop.setPincode(request.pincode());
        shop.setCuisineType(request.cuisineType());
        shop.setLogoUrl(request.logoUrl());
        shop.setBannerUrl(request.bannerUrl());
        return ShopResponse.from(shopRepository.save(shop));
    }

    @Transactional
    public ShopResponse updateStatus(UUID shopId, ShopStatus status) {
        Shop shop = findShopOrThrow(shopId);
        shop.setStatus(status);
        return ShopResponse.from(shopRepository.save(shop));
    }

    @Transactional
    public ShopThemeResponse updateTheme(UUID shopId, ShopThemeRequest request) {
        Shop shop = findShopOrThrow(shopId);
        ShopTheme theme = shopThemeRepository.findByShop_ShopId(shopId)
                .orElseGet(() -> ShopTheme.builder().shop(shop).build());

        if (request.themeName() != null) theme.setThemeName(request.themeName());
        if (request.primaryColor() != null) theme.setPrimaryColor(request.primaryColor());
        if (request.secondaryColor() != null) theme.setSecondaryColor(request.secondaryColor());
        if (request.fontFamily() != null) theme.setFontFamily(request.fontFamily());
        if (request.showAbout() != null) theme.setShowAbout(request.showAbout());
        if (request.showGallery() != null) theme.setShowGallery(request.showGallery());
        if (request.layoutConfig() != null) theme.setLayoutConfig(request.layoutConfig());

        return ShopThemeResponse.from(shopThemeRepository.save(theme));
    }

    @Transactional(readOnly = true)
    public ShopThemeResponse getTheme(UUID shopId) {
        return shopThemeRepository.findByShop_ShopId(shopId)
                .map(ShopThemeResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("No theme configured for shop: " + shopId));
    }

    Shop findShopOrThrow(UUID shopId) {
        return shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found: " + shopId));
    }

    /**
     * Resolves the shop for endpoints that don't take a shopId in the path
     * (the owner-facing dashboard assumes one shop per owner for now).
     * If an owner ever manages multiple shops, these endpoints will need
     * to be updated to accept an explicit shopId instead.
     */
    public Shop getCurrentShopForOwner(UUID ownerId) {
        return shopRepository.findByOwner_UserId(ownerId).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No shop found for owner: " + ownerId));
    }

    // ------------------------------------------------------------------
    // Frontend-shaped methods (owner dashboard theme + public storefront).
    // These sit alongside the shopId/UUID-based API above without changing it.
    // ------------------------------------------------------------------

    /** GET /api/v1/shops/theme - the owner dashboard's own shop, in frontend shape. */
    @Transactional(readOnly = true)
    public ShopFrontendResponse getMyShopFrontend(UUID ownerId) {
        Shop shop = getCurrentShopForOwner(ownerId);
        return toFrontendResponse(shop);
    }

    /** PUT /api/v1/shops/theme - saves template choice + free-form theme object. */
    @Transactional
    public ShopFrontendResponse updateMyTheme(UUID ownerId, ShopThemeUpdateRequest request) {
        Shop shop = getCurrentShopForOwner(ownerId);
        if (request.templateId() != null && !request.templateId().isBlank()) {
            shop.setTemplateId(request.templateId());
            shop = shopRepository.save(shop);
        }

        final Shop finalShop = shop;
ShopTheme theme = shopThemeRepository.findByShop_ShopId(shop.getShopId())
        .orElseGet(() -> ShopTheme.builder().shop(finalShop).build());
        if (request.theme() != null) {
            theme.setThemeData(writeThemeJson(request.theme()));
            if (request.theme().get("primaryColor") instanceof String pc) {
                theme.setPrimaryColor(pc);
            }
        }
        shopThemeRepository.save(theme);

        return toFrontendResponse(shop);
    }

    /** Public GET /api/v1/storefront/{slug} - combined shop + menu for the customer-facing app. */
    @Transactional(readOnly = true)
    public StorefrontResponse getStorefrontBySlug(String slug) {
        Shop shop = shopRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("No shop found for: " + slug));
        List<MenuItemFrontendResponse> menu = menuItemRepository.findByShop_ShopIdAndIsAvailableTrue(shop.getShopId())
                .stream().map(MenuItemFrontendResponse::from).toList();
        return new StorefrontResponse(toFrontendResponse(shop), menu);
    }

    private ShopFrontendResponse toFrontendResponse(Shop shop) {
        Map<String, Object> theme = shopThemeRepository.findByShop_ShopId(shop.getShopId())
                .map(t -> readThemeJson(t.getThemeData()))
                .orElseGet(Collections::emptyMap);

        return new ShopFrontendResponse(
                shop.getShopId(),
                shop.getShopName(),
                shop.getSlug(),
                shop.getServiceType().name(),
                shop.getTemplateId(),
                shop.getDescription(),
                shop.getLogoUrl(),
                shop.getBannerUrl(),
                theme
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readThemeJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private String writeThemeJson(Map<String, Object> theme) {
        try {
            return objectMapper.writeValueAsString(theme);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialize theme data", e);
        }
    }
}
