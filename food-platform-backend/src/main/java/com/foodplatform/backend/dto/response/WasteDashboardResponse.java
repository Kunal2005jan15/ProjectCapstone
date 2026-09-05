package com.foodplatform.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Owner dashboard's Waste Management page. Everything here is derived from
 * existing inventory_transactions rows of type WASTAGE (see TransactionType)
 * joined to the menu item's cost_price for the estimated cost figures - no
 * new tables are required to produce this.
 */
public record WasteDashboardResponse(
        int periodDays,
        BigDecimal totalWasteQuantity,
        BigDecimal totalWasteCost,
        long wasteEventCount,
        List<TrendPoint> trend,
        List<TopWastedItem> topItems
) {
    public record TrendPoint(String date, BigDecimal quantity, BigDecimal cost) {}

    public record TopWastedItem(
            UUID itemId,
            String itemName,
            String unit,
            BigDecimal quantity,
            BigDecimal cost,
            long eventCount
    ) {}
}
