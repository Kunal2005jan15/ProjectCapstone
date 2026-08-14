package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.MenuItemFrontendRequest;
import com.foodplatform.backend.dto.response.MenuItemFrontendResponse;
import com.foodplatform.backend.security.AppUserDetails;
import com.foodplatform.backend.service.MenuItemService;
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

/**
 * Owner-dashboard-facing menu CRUD that resolves the shop from the logged-in
 * owner instead of requiring shopId in the path. Shapes requests/responses to
 * match MenuManagement.jsx exactly: { id, name, description, price, category, active }.
 */
@RestController
@RequestMapping("/api/v1/menu")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
@Tag(name = "Menu Items", description = "Owner dashboard menu CRUD (resolves the caller's own shop)")
public class MyMenuController {

    private final MenuItemService menuItemService;
    private final ShopService shopService;

    @GetMapping
    public ResponseEntity<List<MenuItemFrontendResponse>> list(@AuthenticationPrincipal AppUserDetails principal,
                                                                 @RequestParam(defaultValue = "false") boolean onlyAvailable) {
        UUID shopId = shopService.getCurrentShopForOwner(principal.getUserId()).getShopId();
        return ResponseEntity.ok(menuItemService.getMenuFrontend(shopId, onlyAvailable));
    }

    @PostMapping
    public ResponseEntity<MenuItemFrontendResponse> create(@AuthenticationPrincipal AppUserDetails principal,
                                                            @Valid @RequestBody MenuItemFrontendRequest request) {
        UUID shopId = shopService.getCurrentShopForOwner(principal.getUserId()).getShopId();
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.createMenuItemFrontend(shopId, request));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<MenuItemFrontendResponse> update(@PathVariable UUID itemId,
                                                            @Valid @RequestBody MenuItemFrontendRequest request) {
        return ResponseEntity.ok(menuItemService.updateMenuItemFrontend(itemId, request));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> delete(@PathVariable UUID itemId) {
        menuItemService.deleteMenuItem(itemId);
        return ResponseEntity.noContent().build();
    }
}
