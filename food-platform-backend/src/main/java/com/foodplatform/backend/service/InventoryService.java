package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.InventoryTransactionRequest;
import com.foodplatform.backend.dto.request.InventoryUpsertRequest;
import com.foodplatform.backend.dto.response.InventoryResponse;
import com.foodplatform.backend.dto.response.InventoryTransactionResponse;
import com.foodplatform.backend.dto.response.ReorderSuggestionResponse;
import com.foodplatform.backend.entity.Forecast;
import com.foodplatform.backend.entity.Inventory;
import com.foodplatform.backend.entity.InventoryTransaction;
import com.foodplatform.backend.entity.MenuItem;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.entity.enums.TransactionType;
import com.foodplatform.backend.exception.BadRequestException;
import com.foodplatform.backend.exception.ResourceNotFoundException;
import com.foodplatform.backend.repository.ForecastRepository;
import com.foodplatform.backend.repository.InventoryRepository;
import com.foodplatform.backend.repository.InventoryTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Owns stock levels and the low-stock alert rule described in the proposal:
 *   if forecasted_demand_next_N_days > current_stock -> alert
 * Here we expose both a simple threshold check (reorder_level) and a hook
 * the ForecastService can call once a forecast exists (see ForecastService).
 */
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final MenuItemService menuItemService;
    private final ShopService shopService;
    private final ForecastRepository forecastRepository;

    @Transactional
    public InventoryResponse upsertInventory(UUID shopId, InventoryUpsertRequest request) {
        Shop shop = shopService.findShopOrThrow(shopId);
        MenuItem item = menuItemService.findItemOrThrow(request.itemId());

        Inventory inventory = inventoryRepository.findByMenuItem_ItemId(request.itemId())
                .orElseGet(() -> Inventory.builder().shop(shop).menuItem(item).build());

        inventory.setCurrentStock(request.currentStock());
        if (request.unit() != null) inventory.setUnit(request.unit());
        if (request.reorderLevel() != null) inventory.setReorderLevel(request.reorderLevel());
        if (request.safetyStock() != null) inventory.setSafetyStock(request.safetyStock());

        return InventoryResponse.from(inventoryRepository.save(inventory));
    }

    public List<InventoryResponse> getInventory(UUID shopId) {
        return inventoryRepository.findByShop_ShopId(shopId).stream().map(InventoryResponse::from).toList();
    }

    /** Rule-based low-stock alert list: current_stock <= reorder_level. */
    public List<InventoryResponse> getLowStockAlerts(UUID shopId) {
        return inventoryRepository.findByShop_ShopId(shopId).stream()
                .filter(inv -> inv.getCurrentStock().compareTo(inv.getReorderLevel()) <= 0)
                .map(InventoryResponse::from)
                .toList();
    }

    @Transactional
    public InventoryTransactionResponse recordTransaction(UUID inventoryId, InventoryTransactionRequest request) {
        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory record not found: " + inventoryId));

        applyTransaction(inventory, request.transactionType(), request.quantity());

        InventoryTransaction txn = InventoryTransaction.builder()
                .inventory(inventory)
                .transactionType(request.transactionType())
                .quantity(request.quantity())
                .reason(request.reason())
                .build();

        return InventoryTransactionResponse.from(transactionRepository.save(txn));
    }

    public List<InventoryTransactionResponse> getTransactions(UUID inventoryId) {
        return transactionRepository.findByInventory_InventoryIdOrderByTransactionTimeDesc(inventoryId)
                .stream().map(InventoryTransactionResponse::from).toList();
    }

    /** Deducts stock for a SALE. Called by OrderService when an order is placed. */
    @Transactional
    public void deductForSale(UUID itemId, BigDecimal quantity, UUID orderId) {
        inventoryRepository.findByMenuItem_ItemId(itemId).ifPresent(inventory -> {
            applyTransaction(inventory, TransactionType.SALE, quantity);
            transactionRepository.save(InventoryTransaction.builder()
                    .inventory(inventory)
                    .transactionType(TransactionType.SALE)
                    .quantity(quantity)
                    .reason("Order " + orderId)
                    .build());
        });
    }

    /**
     * Connects the Prophet-based demand forecasts (forecasts table, populated
     * by the ml-service - see ForecastService) to inventory reorder decisions:
     *
     *   suggestedReorderQty = forecastedDemand(next `days` days) + safetyStock - currentStock
     *
     * If no forecast rows exist yet for an item (ml-service hasn't run for it,
     * or it's brand new), forecastedDemand is 0 and the suggestion falls back
     * to the plain reorder_level rule already used by getLowStockAlerts.
     */
    @Transactional(readOnly = true)
    public List<ReorderSuggestionResponse> getReorderSuggestions(UUID shopId, int days) {
        int horizonDays = Math.max(1, days);
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(horizonDays);

        return inventoryRepository.findByShop_ShopId(shopId).stream()
                .map(inv -> {
                    UUID itemId = inv.getMenuItem().getItemId();
                    List<Forecast> forecasts = forecastRepository
                            .findByShop_ShopIdAndMenuItem_ItemIdAndForecastDateBetween(shopId, itemId, today, horizon);

                    BigDecimal forecastedDemand = forecasts.stream()
                            .map(Forecast::getPredictedQuantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    String source = forecasts.isEmpty() ? "no_forecast_data" : "prophet_forecast";

                    BigDecimal needed = forecastedDemand.add(inv.getSafetyStock()).subtract(inv.getCurrentStock());
                    BigDecimal suggested = needed.max(BigDecimal.ZERO);

                    return new ReorderSuggestionResponse(
                            inv.getInventoryId(), itemId, inv.getMenuItem().getItemName(), inv.getUnit(),
                            inv.getCurrentStock(), inv.getSafetyStock(), inv.getReorderLevel(),
                            forecastedDemand, horizonDays, suggested, suggested.signum() > 0, source
                    );
                })
                .toList();
    }

    private void applyTransaction(Inventory inventory, TransactionType type, BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new BadRequestException("Transaction quantity must be positive");
        }
        BigDecimal delta = switch (type) {
            case PURCHASE, RESTOCK, ADJUSTMENT -> quantity;
            case SALE, WASTAGE -> quantity.negate();
        };
        inventory.setCurrentStock(inventory.getCurrentStock().add(delta));
        inventory.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(inventory);
    }
}
