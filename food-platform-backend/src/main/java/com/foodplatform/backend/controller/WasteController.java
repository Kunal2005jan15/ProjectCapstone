package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.response.WasteDashboardResponse;
import com.foodplatform.backend.service.WasteService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Waste Management dashboard - quantity, estimated cost, trend, and
 * frequently-wasted items, all derived from the existing WASTAGE-type
 * inventory_transactions rows (see WasteService). Logging a new waste event
 * reuses the existing endpoint:
 *   POST /api/v1/shops/{shopId}/inventory/{inventoryId}/transactions
 *   { "transactionType": "WASTAGE", "quantity": ..., "reason": "..." }
 * so no separate "create waste" endpoint is introduced here.
 */
@RestController
@RequestMapping("/api/v1/shops/{shopId}/waste")
@RequiredArgsConstructor
@Tag(name = "Waste Management", description = "Waste quantity, estimated cost, trend, and top wasted items")
public class WasteController {

    private final WasteService wasteService;

    @GetMapping
    public ResponseEntity<WasteDashboardResponse> dashboard(
            @PathVariable UUID shopId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(wasteService.getWasteDashboard(shopId, days));
    }
}
