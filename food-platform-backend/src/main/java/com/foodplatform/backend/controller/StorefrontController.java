package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.response.StorefrontResponse;
import com.foodplatform.backend.service.ShopService;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public, no-login endpoint backing the customer-facing storefront
 * (StoreContext.jsx's loadShop): GET /store/:slug -> GET /api/v1/storefront/{slug}.
 * Returns the shop (with theme/template) and its available menu together so
 * the frontend needs exactly one request to render a store page.
 */
@RestController
@RequestMapping("/api/v1/storefront")
@RequiredArgsConstructor
@SecurityRequirements
@Tag(name = "Storefront", description = "Public customer-facing storefront lookup by slug")
public class StorefrontController {

    private final ShopService shopService;

    @GetMapping("/{slug}")
    public ResponseEntity<StorefrontResponse> getStorefront(@PathVariable String slug) {
        return ResponseEntity.ok(shopService.getStorefrontBySlug(slug));
    }
}
