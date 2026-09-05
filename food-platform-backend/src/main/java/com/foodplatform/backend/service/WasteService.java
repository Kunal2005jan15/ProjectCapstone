package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.response.WasteDashboardResponse;
import com.foodplatform.backend.dto.response.WasteDashboardResponse.TopWastedItem;
import com.foodplatform.backend.dto.response.WasteDashboardResponse.TrendPoint;
import com.foodplatform.backend.entity.InventoryTransaction;
import com.foodplatform.backend.entity.MenuItem;
import com.foodplatform.backend.entity.enums.TransactionType;
import com.foodplatform.backend.repository.InventoryTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Waste Management analytics, built entirely on top of the existing
 * inventory_transactions table (rows recorded with transactionType =
 * WASTAGE - see InventoryService#applyTransaction). No new table is needed:
 * every time stock is marked as wasted/expired/thrown away through the
 * existing "record transaction" endpoint, it already lands here.
 *
 * Waste cost is estimated as wastedQuantity * menuItem.costPrice. Follows
 * the same in-memory aggregation style as AnalyticsService, since this
 * project favors simple Java-side aggregation over SQL GROUP BY at its
 * current scale.
 */
@Service
@RequiredArgsConstructor
public class WasteService {

    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("MMM d");

    private final InventoryTransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public WasteDashboardResponse getWasteDashboard(UUID shopId, int days) {
        int periodDays = Math.max(1, days);
        LocalDateTime to = LocalDateTime.now();
        LocalDateTime from = to.minusDays(periodDays);

        List<InventoryTransaction> wastage = transactionRepository
                .findByInventory_Shop_ShopIdAndTransactionTypeAndTransactionTimeBetween(
                        shopId, TransactionType.WASTAGE, from, to);

        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;

        Map<LocalDate, BigDecimal[]> byDay = initTrendBuckets(periodDays);
        Map<UUID, ItemAccumulator> byItem = new LinkedHashMap<>();

        for (InventoryTransaction txn : wastage) {
            MenuItem item = txn.getInventory().getMenuItem();
            BigDecimal qty = txn.getQuantity() == null ? BigDecimal.ZERO : txn.getQuantity();
            BigDecimal unitCost = item.getCostPrice() != null ? item.getCostPrice() : BigDecimal.ZERO;
            BigDecimal cost = qty.multiply(unitCost);

            totalQty = totalQty.add(qty);
            totalCost = totalCost.add(cost);

            LocalDate day = txn.getTransactionTime().toLocalDate();
            byDay.computeIfPresent(day, (d, agg) -> {
                agg[0] = agg[0].add(qty);
                agg[1] = agg[1].add(cost);
                return agg;
            });

            byItem.computeIfAbsent(item.getItemId(), id -> new ItemAccumulator(item.getItemName()))
                    .add(qty, cost);
        }

        List<TrendPoint> trend = byDay.entrySet().stream()
                .map(e -> new TrendPoint(e.getKey().format(DAY_FORMAT), e.getValue()[0], e.getValue()[1]))
                .toList();

        List<TopWastedItem> topItems = byItem.entrySet().stream()
                .map(e -> new TopWastedItem(
                        e.getKey(), e.getValue().itemName, resolveUnit(wastage, e.getKey()),
                        e.getValue().quantity, e.getValue().cost, e.getValue().eventCount))
                .sorted(Comparator.comparing(TopWastedItem::quantity).reversed())
                .limit(10)
                .toList();

        return new WasteDashboardResponse(
                periodDays, totalQty, totalCost, wastage.size(), trend, topItems
        );
    }

    private Map<LocalDate, BigDecimal[]> initTrendBuckets(int days) {
        // Oldest -> newest, capped at 60 points so a large `days` value
        // doesn't render an unreadable chart.
        int points = Math.min(days, 60);
        Map<LocalDate, BigDecimal[]> buckets = new LinkedHashMap<>();
        for (int i = points - 1; i >= 0; i--) {
            buckets.put(LocalDate.now().minusDays(i), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }
        return buckets;
    }

    private String resolveUnit(List<InventoryTransaction> wastage, UUID itemId) {
        return wastage.stream()
                .filter(t -> t.getInventory().getMenuItem().getItemId().equals(itemId))
                .map(t -> t.getInventory().getUnit())
                .filter(u -> u != null && !u.isBlank())
                .findFirst()
                .orElse("units");
    }

    private static class ItemAccumulator {
        final String itemName;
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal cost = BigDecimal.ZERO;
        long eventCount = 0;

        ItemAccumulator(String itemName) {
            this.itemName = itemName;
        }

        void add(BigDecimal qty, BigDecimal cost) {
            this.quantity = this.quantity.add(qty);
            this.cost = this.cost.add(cost);
            this.eventCount++;
        }
    }
}
