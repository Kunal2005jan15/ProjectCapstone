package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.TableRequest;
import com.foodplatform.backend.dto.response.TableResponse;
import com.foodplatform.backend.entity.RestaurantTable;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.exception.ResourceNotFoundException;
import com.foodplatform.backend.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TableService {

    private final RestaurantTableRepository tableRepository;
    private final ShopService shopService;

    @Transactional
    public TableResponse createTable(UUID ownerId, TableRequest request) {
        Shop shop = shopService.getCurrentShopForOwner(ownerId);
        int nextNumber = tableRepository.findByShop_ShopIdOrderByTableNumberAsc(shop.getShopId()).stream()
                .mapToInt(RestaurantTable::getTableNumber)
                .max()
                .orElse(0) + 1;
        RestaurantTable table = RestaurantTable.builder()
                .shop(shop)
                .tableNumber(nextNumber)
                .seats(request.seats() != null ? request.seats() : 2)
                .isActive(true)
                .build();
        return TableResponse.from(tableRepository.save(table));
    }

    public List<TableResponse> getTablesForOwner(UUID ownerId) {
        Shop shop = shopService.getCurrentShopForOwner(ownerId);
        return tableRepository.findByShop_ShopIdOrderByTableNumberAsc(shop.getShopId()).stream()
                .map(TableResponse::from)
                .toList();
    }

    @Transactional
    public void deleteTable(UUID tableId) {
        if (!tableRepository.existsById(tableId)) {
            throw new ResourceNotFoundException("Table not found: " + tableId);
        }
        tableRepository.deleteById(tableId);
    }
}
