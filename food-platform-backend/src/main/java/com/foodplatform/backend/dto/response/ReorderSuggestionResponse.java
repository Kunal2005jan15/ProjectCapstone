package com.foodplatform.backend.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Connects the Prophet-based demand forecasts (see ForecastService, populated
 * by ml-service/app/integration/push_live_forecasts.py) to Inventory
 * Management's reorder decision:
 *
 *   suggestedReorderQty = forecastedDemand (next N days) + safetyStock - currentStock
 *
 * Same rule shape as the standalone Dineflow Prophet reorder demo
 * (multi_item_forecast_reorder.py), but computed from forecasts already
 * persisted in the `forecasts` table instead of re-running Prophet here.
 */
public record ReorderSuggestionResponse(
        UUID inventoryId,
        UUID itemId,
        String itemName,
        String unit,
        BigDecimal currentStock,
        BigDecimal safetyStock,
        BigDecimal reorderLevel,
        BigDecimal forecastedDemand,
        int forecastDays,
        BigDecimal suggestedReorderQty,
        boolean reorderRecommended,
        String forecastSource // "prophet_forecast" | "no_forecast_data"
) {}
