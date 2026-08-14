package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.ShopRequest;
import com.foodplatform.backend.dto.request.ShopThemeRequest;
import com.foodplatform.backend.dto.request.ShopThemeUpdateRequest;
import com.foodplatform.backend.dto.response.ShopFrontendResponse;
import com.foodplatform.backend.dto.response.ShopResponse;
import com.foodplatform.backend.dto.response.ShopThemeResponse;
import com.foodplatform.backend.entity.enums.ShopStatus;
import com.foodplatform.backend.security.AppUserDetails;
import com.foodplatform.backend.service.ShopService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shops")
@RequiredArgsConstructor
@Tag(name = "Shops", description = "Shop onboarding, profile management, and theme customization")
public class ShopController {

    private final ShopService shopService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ShopResponse> createShop(@AuthenticationPrincipal AppUserDetails principal,
                                                    @Valid @RequestBody ShopRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shopService.createShop(principal.getUserId(), request));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<ShopResponse>> myShops(@AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(shopService.getShopsByOwner(principal.getUserId()));
    }

    @GetMapping("/{shopId}/public")
    public ResponseEntity<ShopResponse> getShopPublic(@PathVariable UUID shopId) {
        return ResponseEntity.ok(shopService.getShop(shopId));
    }

    @GetMapping("/{shopId}")
    public ResponseEntity<ShopResponse> getShop(@PathVariable UUID shopId) {
        return ResponseEntity.ok(shopService.getShop(shopId));
    }

    @PutMapping("/{shopId}")
    public ResponseEntity<ShopResponse> updateShop(@PathVariable UUID shopId, @Valid @RequestBody ShopRequest request) {
        return ResponseEntity.ok(shopService.updateShop(shopId, request));
    }

    @PatchMapping("/{shopId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShopResponse> updateStatus(@PathVariable UUID shopId, @RequestParam ShopStatus status) {
        return ResponseEntity.ok(shopService.updateStatus(shopId, status));
    }

    /** Shop-id-less alias for the owner dashboard: resolves the caller's own shop. */
    @PutMapping("/mine")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ShopResponse> updateMyShop(@AuthenticationPrincipal AppUserDetails principal,
                                                      @Valid @RequestBody ShopRequest request) {
        UUID shopId = shopService.getCurrentShopForOwner(principal.getUserId()).getShopId();
        return ResponseEntity.ok(shopService.updateShop(shopId, request));
    }

    @GetMapping("/{shopId}/theme")
    public ResponseEntity<ShopThemeResponse> getTheme(@PathVariable UUID shopId) {
        return ResponseEntity.ok(shopService.getTheme(shopId));
    }

    @PutMapping("/{shopId}/theme")
    public ResponseEntity<ShopThemeResponse> updateTheme(@PathVariable UUID shopId,
                                                          @RequestBody ShopThemeRequest request) {
        return ResponseEntity.ok(shopService.updateTheme(shopId, request));
    }

    /**
     * Shop-id-less alias for the owner dashboard: resolves the caller's own shop.
     * Returns the full frontend shop shape (id, name, slug, templateId, theme, ...)
     * because StoreCustomization.jsx / OnboardingTemplate.jsx call setShop(res.data) directly.
     */
    @GetMapping("/theme")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ShopFrontendResponse> getMyTheme(@AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(shopService.getMyShopFrontend(principal.getUserId()));
    }

    /** Shop-id-less alias for the owner dashboard: resolves the caller's own shop. */
    @PutMapping("/theme")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ShopFrontendResponse> updateMyTheme(@AuthenticationPrincipal AppUserDetails principal,
                                                               @RequestBody ShopThemeUpdateRequest request) {
        return ResponseEntity.ok(shopService.updateMyTheme(principal.getUserId(), request));
    }
}
