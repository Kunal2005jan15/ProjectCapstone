package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.CategoryRequest;
import com.foodplatform.backend.dto.response.CategoryResponse;
import com.foodplatform.backend.service.CategoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shops/{shopId}/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Menu categories (Starters, Beverages, etc.)")
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@PathVariable UUID shopId,
                                                    @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(shopId, request));
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> list(@PathVariable UUID shopId) {
        return ResponseEntity.ok(categoryService.getCategories(shopId));
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> update(@PathVariable UUID shopId, @PathVariable UUID categoryId,
                                                    @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(categoryId, request));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> delete(@PathVariable UUID shopId, @PathVariable UUID categoryId) {
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
