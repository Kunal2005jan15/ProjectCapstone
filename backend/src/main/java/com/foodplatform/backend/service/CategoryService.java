package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.CategoryRequest;
import com.foodplatform.backend.dto.response.CategoryResponse;
import com.foodplatform.backend.entity.Category;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.exception.ResourceNotFoundException;
import com.foodplatform.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ShopService shopService;

    @Transactional
    public CategoryResponse createCategory(UUID shopId, CategoryRequest request) {
        Shop shop = shopService.findShopOrThrow(shopId);
        Category category = Category.builder()
                .shop(shop)
                .categoryName(request.categoryName())
                .description(request.description())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .isActive(request.isActive() == null || request.isActive())
                .build();
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public List<CategoryResponse> getCategories(UUID shopId) {
        return categoryRepository.findByShop_ShopIdOrderByDisplayOrderAsc(shopId)
                .stream().map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse updateCategory(UUID categoryId, CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
        category.setCategoryName(request.categoryName());
        category.setDescription(request.description());
        if (request.displayOrder() != null) category.setDisplayOrder(request.displayOrder());
        if (request.isActive() != null) category.setActive(request.isActive());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(UUID categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found: " + categoryId);
        }
        categoryRepository.deleteById(categoryId);
    }
}
