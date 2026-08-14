package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.CategoryRequest;
import com.foodplatform.backend.dto.response.CategoryResponse;
import com.foodplatform.backend.security.AppUserDetails;
import com.foodplatform.backend.service.CategoryService;
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
 * Owner-dashboard-facing category list/create that resolves the shop from the
 * logged-in owner instead of requiring shopId in the path (mirrors MyMenuController).
 */
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
@Tag(name = "Categories", description = "Owner dashboard category list/create (resolves the caller's own shop)")
public class MyCategoryController {

    private final CategoryService categoryService;
    private final ShopService shopService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> list(@AuthenticationPrincipal AppUserDetails principal) {
        UUID shopId = shopService.getCurrentShopForOwner(principal.getUserId()).getShopId();
        return ResponseEntity.ok(categoryService.getCategories(shopId));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@AuthenticationPrincipal AppUserDetails principal,
                                                    @Valid @RequestBody CategoryRequest request) {
        UUID shopId = shopService.getCurrentShopForOwner(principal.getUserId()).getShopId();
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(shopId, request));
    }
}
