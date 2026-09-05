package com.foodplatform.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Body of POST /api/v1/orders/guest, matching Checkout.jsx exactly:
 * { shopId, items: [{itemId, qty, price}], customerName, customerPhone, totalAmount }.
 * The client-sent price/totalAmount are informational only - the server always
 * recomputes totals from the current menu item prices for integrity.
 */
public record GuestOrderRequest(
        @NotNull UUID shopId,
        @NotEmpty @Valid List<Item> items,
        String customerName,
        String customerPhone,
        BigDecimal totalAmount,
        String tableNumber
) {
    public record Item(
            @NotNull UUID itemId,
            @NotNull @Min(1) Integer qty,
            BigDecimal price
    ) {}
}
