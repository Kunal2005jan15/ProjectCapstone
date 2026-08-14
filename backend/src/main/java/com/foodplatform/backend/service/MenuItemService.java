package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.MenuItemFrontendRequest;
import com.foodplatform.backend.dto.request.MenuItemRequest;
import com.foodplatform.backend.dto.response.MenuItemFrontendResponse;
import com.foodplatform.backend.dto.response.MenuItemResponse;
import com.foodplatform.backend.entity.Category;
import com.foodplatform.backend.entity.Inventory;
import com.foodplatform.backend.entity.MenuItem;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.exception.ResourceNotFoundException;
import com.foodplatform.backend.repository.CategoryRepository;
import com.foodplatform.backend.repository.InventoryRepository;
import com.foodplatform.backend.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final ShopService shopService;

    @Transactional
    public MenuItemResponse createMenuItem(UUID shopId, MenuItemRequest request) {
        Shop shop = shopService.findShopOrThrow(shopId);
        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.categoryId()));
        }

        MenuItem item = MenuItem.builder()
                .shop(shop)
                .category(category)
                .itemName(request.itemName())
                .description(request.description())
                .price(request.price())
                .costPrice(request.costPrice())
                .imageUrl(request.imageUrl())
                .isVegetarian(request.isVegetarian() == null || request.isVegetarian())
                .isAvailable(request.isAvailable() == null || request.isAvailable())
                .preparationTime(request.preparationTime())
                .build();
        item = menuItemRepository.save(item);

        // Optionally seed inventory (MENU_ITEM 1:1 INVENTORY per the ER design).
        if (request.initialStock() != null) {
            Inventory inventory = Inventory.builder()
                    .shop(shop)
                    .menuItem(item)
                    .currentStock(request.initialStock())
                    .unit(request.stockUnit())
                    .reorderLevel(request.reorderLevel() != null ? request.reorderLevel() : BigDecimal.ZERO)
                    .safetyStock(request.safetyStock() != null ? request.safetyStock() : BigDecimal.ZERO)
                    .lastUpdated(LocalDateTime.now())
                    .build();
            inventoryRepository.save(inventory);
        }

        return MenuItemResponse.from(item);
    }

    @Transactional(readOnly = true)
    public MenuItemResponse getMenuItem(UUID itemId) {
        return MenuItemResponse.from(findItemOrThrow(itemId));
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponse> getMenu(UUID shopId, boolean onlyAvailable) {
        List<MenuItem> items = onlyAvailable
                ? menuItemRepository.findByShop_ShopIdAndIsAvailableTrue(shopId)
                : menuItemRepository.findByShop_ShopId(shopId);
        return items.stream().map(MenuItemResponse::from).toList();
    }

    @Transactional
    public MenuItemResponse updateMenuItem(UUID itemId, MenuItemRequest request) {
        MenuItem item = findItemOrThrow(itemId);

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.categoryId()));
            item.setCategory(category);
        }
        item.setItemName(request.itemName());
        item.setDescription(request.description());
        item.setPrice(request.price());
        if (request.costPrice() != null) item.setCostPrice(request.costPrice());
        item.setImageUrl(request.imageUrl());
        if (request.isVegetarian() != null) item.setVegetarian(request.isVegetarian());
        if (request.isAvailable() != null) item.setAvailable(request.isAvailable());
        item.setPreparationTime(request.preparationTime());

        return MenuItemResponse.from(menuItemRepository.save(item));
    }

    @Transactional
    public void deleteMenuItem(UUID itemId) {
        if (!menuItemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("Menu item not found: " + itemId);
        }
        menuItemRepository.deleteById(itemId);
    }

    MenuItem findItemOrThrow(UUID itemId) {
        return menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found: " + itemId));
    }

    // ------------------------------------------------------------------
    // Frontend-shaped CRUD (MenuManagement.jsx / Storefront.jsx): id, name,
    // description, price, category (free-text name), active.
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<MenuItemFrontendResponse> getMenuFrontend(UUID shopId, boolean onlyAvailable) {
        List<MenuItem> items = onlyAvailable
                ? menuItemRepository.findByShop_ShopIdAndIsAvailableTrue(shopId)
                : menuItemRepository.findByShop_ShopId(shopId);
        return items.stream().map(MenuItemFrontendResponse::from).toList();
    }

    @Transactional
    public MenuItemFrontendResponse createMenuItemFrontend(UUID shopId, MenuItemFrontendRequest request) {
        Shop shop = shopService.findShopOrThrow(shopId);
        MenuItem item = MenuItem.builder()
                .shop(shop)
                .category(resolveCategory(shop, request.category()))
                .itemName(request.name())
                .description(request.description())
                .price(request.price())
                .isVegetarian(true)
                .isAvailable(request.active() == null || request.active())
                .build();
        return MenuItemFrontendResponse.from(menuItemRepository.save(item));
    }

    @Transactional
    public MenuItemFrontendResponse updateMenuItemFrontend(UUID itemId, MenuItemFrontendRequest request) {
        MenuItem item = findItemOrThrow(itemId);
        if (request.category() != null && !request.category().isBlank()) {
            item.setCategory(resolveCategory(item.getShop(), request.category()));
        }
        item.setItemName(request.name());
        item.setDescription(request.description());
        item.setPrice(request.price());
        if (request.active() != null) item.setAvailable(request.active());
        return MenuItemFrontendResponse.from(menuItemRepository.save(item));
    }

    /** Finds an existing category by name (case-insensitive) for this shop, or creates one. */
    private Category resolveCategory(Shop shop, String categoryName) {
        if (categoryName == null || categoryName.isBlank()) return null;
        return categoryRepository.findByShop_ShopIdAndCategoryNameIgnoreCase(shop.getShopId(), categoryName.trim())
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .shop(shop)
                        .categoryName(categoryName.trim())
                        .isActive(true)
                        .build()));
    }
}
