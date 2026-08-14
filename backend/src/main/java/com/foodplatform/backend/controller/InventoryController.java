package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.InventoryTransactionRequest;
import com.foodplatform.backend.dto.request.InventoryUpsertRequest;
import com.foodplatform.backend.dto.response.InventoryResponse;
import com.foodplatform.backend.dto.response.InventoryTransactionResponse;
import com.foodplatform.backend.service.InventoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shops/{shopId}/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Stock levels, transactions, and rule-based low-stock alerts")
public class InventoryController {

    private final InventoryService inventoryService;

    @PutMapping
    public ResponseEntity<InventoryResponse> upsert(@PathVariable UUID shopId,
                                                     @Valid @RequestBody InventoryUpsertRequest request) {
        return ResponseEntity.ok(inventoryService.upsertInventory(shopId, request));
    }

    @GetMapping
    public ResponseEntity<List<InventoryResponse>> list(@PathVariable UUID shopId) {
        return ResponseEntity.ok(inventoryService.getInventory(shopId));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<InventoryResponse>> lowStockAlerts(@PathVariable UUID shopId) {
        return ResponseEntity.ok(inventoryService.getLowStockAlerts(shopId));
    }

    @PostMapping("/{inventoryId}/transactions")
    public ResponseEntity<InventoryTransactionResponse> recordTransaction(
            @PathVariable UUID shopId, @PathVariable UUID inventoryId,
            @Valid @RequestBody InventoryTransactionRequest request) {
        return ResponseEntity.ok(inventoryService.recordTransaction(inventoryId, request));
    }

    @GetMapping("/{inventoryId}/transactions")
    public ResponseEntity<List<InventoryTransactionResponse>> getTransactions(
            @PathVariable UUID shopId, @PathVariable UUID inventoryId) {
        return ResponseEntity.ok(inventoryService.getTransactions(inventoryId));
    }
}
