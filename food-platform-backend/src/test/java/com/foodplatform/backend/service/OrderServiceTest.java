package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.OrderItemRequest;
import com.foodplatform.backend.dto.request.OrderRequest;
import com.foodplatform.backend.dto.response.OrderResponse;
import com.foodplatform.backend.entity.MenuItem;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.exception.BadRequestException;
import com.foodplatform.backend.repository.CustomerRepository;
import com.foodplatform.backend.repository.CustomerSessionRepository;
import com.foodplatform.backend.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerSessionRepository sessionRepository;
    @Mock private MenuItemService menuItemService;
    @Mock private ShopService shopService;
    @Mock private InventoryService inventoryService;

    @InjectMocks
    private OrderService orderService;

    private Shop shop;
    private MenuItem burger;
    private MenuItem coke;

    @BeforeEach
    void setUp() {
        shop = Shop.builder().shopId(UUID.randomUUID()).build();
        burger = MenuItem.builder().itemId(UUID.randomUUID()).itemName("Burger")
                .price(new BigDecimal("150.00")).isAvailable(true).build();
        coke = MenuItem.builder().itemId(UUID.randomUUID()).itemName("Coke")
                .price(new BigDecimal("60.00")).isAvailable(true).build();
    }

    @Test
    void placeOrder_calculatesSubtotalTaxAndTotalCorrectly() {
        when(shopService.findShopOrThrow(shop.getShopId())).thenReturn(shop);
        when(menuItemService.findItemOrThrow(burger.getItemId())).thenReturn(burger);
        when(menuItemService.findItemOrThrow(coke.getItemId())).thenReturn(coke);
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OrderRequest request = new OrderRequest(
                shop.getShopId(), null, null, null, "T-4", null,
                List.of(new OrderItemRequest(burger.getItemId(), 2),
                        new OrderItemRequest(coke.getItemId(), 2))
        );

        OrderResponse response = orderService.placeOrder(request);

        // subtotal = 2*150 + 2*60 = 420.00 ; tax = 5% = 21.00 ; total = 441.00
        assertThat(response.subtotal()).isEqualByComparingTo("420.00");
        assertThat(response.tax()).isEqualByComparingTo("21.00");
        assertThat(response.totalAmount()).isEqualByComparingTo("441.00");
        assertThat(response.items()).hasSize(2);

        verify(inventoryService, times(2)).deductForSale(any(), any(), any());
    }

    @Test
    void placeOrder_rejectsUnavailableMenuItem() {
        burger.setAvailable(false);
        when(shopService.findShopOrThrow(shop.getShopId())).thenReturn(shop);
        when(menuItemService.findItemOrThrow(burger.getItemId())).thenReturn(burger);

        OrderRequest request = new OrderRequest(
                shop.getShopId(), null, null, null, null, null,
                List.of(new OrderItemRequest(burger.getItemId(), 1))
        );

        assertThatThrownBy(() -> orderService.placeOrder(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("unavailable");

        verifyNoInteractions(inventoryService);
    }
}
