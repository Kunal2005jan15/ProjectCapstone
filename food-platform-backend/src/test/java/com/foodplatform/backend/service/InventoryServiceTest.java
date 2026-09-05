package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.InventoryTransactionRequest;
import com.foodplatform.backend.dto.response.InventoryTransactionResponse;
import com.foodplatform.backend.entity.Inventory;
import com.foodplatform.backend.entity.MenuItem;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.entity.enums.TransactionType;
import com.foodplatform.backend.exception.BadRequestException;
import com.foodplatform.backend.repository.InventoryRepository;
import com.foodplatform.backend.repository.InventoryTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock private InventoryRepository inventoryRepository;
    @Mock private InventoryTransactionRepository transactionRepository;
    @Mock private MenuItemService menuItemService;
    @Mock private ShopService shopService;

    @InjectMocks
    private InventoryService inventoryService;

    private Inventory inventory;

    @BeforeEach
    void setUp() {
        Shop shop = Shop.builder().shopId(UUID.randomUUID()).build();
        MenuItem menuItem = MenuItem.builder().itemId(UUID.randomUUID()).itemName("Cold Coffee").build();
        inventory = Inventory.builder()
                .inventoryId(UUID.randomUUID())
                .shop(shop)
                .menuItem(menuItem)
                .currentStock(new BigDecimal("50.00"))
                .reorderLevel(new BigDecimal("10.00"))
                .safetyStock(new BigDecimal("5.00"))
                .build();
    }

    @Test
    void saleTransaction_decreasesCurrentStock() {
        when(inventoryRepository.findById(inventory.getInventoryId())).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InventoryTransactionRequest request =
                new InventoryTransactionRequest(TransactionType.SALE, new BigDecimal("5.00"), "Order #123");

        InventoryTransactionResponse response =
                inventoryService.recordTransaction(inventory.getInventoryId(), request);

        assertThat(inventory.getCurrentStock()).isEqualByComparingTo("45.00");
        assertThat(response.transactionType()).isEqualTo(TransactionType.SALE);
    }

    @Test
    void restockTransaction_increasesCurrentStock() {
        when(inventoryRepository.findById(inventory.getInventoryId())).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InventoryTransactionRequest request =
                new InventoryTransactionRequest(TransactionType.RESTOCK, new BigDecimal("20.00"), "Weekly delivery");

        inventoryService.recordTransaction(inventory.getInventoryId(), request);

        assertThat(inventory.getCurrentStock()).isEqualByComparingTo("70.00");
    }

    @Test
    void negativeOrZeroQuantity_throwsBadRequest() {
        when(inventoryRepository.findById(inventory.getInventoryId())).thenReturn(Optional.of(inventory));

        InventoryTransactionRequest request =
                new InventoryTransactionRequest(TransactionType.SALE, BigDecimal.ZERO, "invalid");

        assertThatThrownBy(() -> inventoryService.recordTransaction(inventory.getInventoryId(), request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void lowStockAlert_flagsItemsAtOrBelowReorderLevel() {
        inventory.setCurrentStock(new BigDecimal("8.00")); // <= reorderLevel(10)
        when(inventoryRepository.findByShop_ShopId(inventory.getShop().getShopId()))
                .thenReturn(List.of(inventory));

        var alerts = inventoryService.getLowStockAlerts(inventory.getShop().getShopId());

        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).lowStock()).isTrue();
    }
}
