package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.MenuItemRequest;
import com.foodplatform.backend.dto.response.MenuItemResponse;
import com.foodplatform.backend.service.MenuItemService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shops/{shopId}/menu")
@RequiredArgsConstructor
@Tag(name = "Menu Items", description = "Menu item CRUD and public menu browsing (no login required)")
public class MenuItemController {

    private final MenuItemService menuItemService;

    @PostMapping
    public ResponseEntity<MenuItemResponse> create(@PathVariable UUID shopId,
                                                    @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.createMenuItem(shopId, request));
    }

    /** Public, no-login menu browsing - the core of the QR-scan customer flow. */
    @GetMapping
    public ResponseEntity<List<MenuItemResponse>> list(@PathVariable UUID shopId,
                                                        @RequestParam(defaultValue = "true") boolean onlyAvailable) {
        return ResponseEntity.ok(menuItemService.getMenu(shopId, onlyAvailable));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<MenuItemResponse> get(@PathVariable UUID shopId, @PathVariable UUID itemId) {
        return ResponseEntity.ok(menuItemService.getMenuItem(itemId));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<MenuItemResponse> update(@PathVariable UUID shopId, @PathVariable UUID itemId,
                                                    @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(menuItemService.updateMenuItem(itemId, request));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> delete(@PathVariable UUID shopId, @PathVariable UUID itemId) {
        menuItemService.deleteMenuItem(itemId);
        return ResponseEntity.noContent().build();
    }
}
