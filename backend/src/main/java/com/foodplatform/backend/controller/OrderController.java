package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.GuestOrderRequest;
import com.foodplatform.backend.dto.request.OrderRequest;
import com.foodplatform.backend.dto.request.OrderStatusUpdateRequest;
import com.foodplatform.backend.dto.response.OrderFrontendResponse;
import com.foodplatform.backend.dto.response.OrderResponse;
import com.foodplatform.backend.security.AppUserDetails;
import com.foodplatform.backend.service.OrderService;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order placement (login or guest) and the owner-facing order dashboard")
public class OrderController {

    private final OrderService orderService;

    /** Authenticated customer / owner-initiated order placement. */
    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(request));
    }

    /** No-login guest ordering flow (QR scan -> browse -> cart -> order). Matches Checkout.jsx exactly. */
    @PostMapping("/guest")
    @SecurityRequirements
    public ResponseEntity<OrderFrontendResponse> placeGuestOrder(@Valid @RequestBody GuestOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeGuestOrder(request));
    }

    /** Order tracking page (no login required - the order id itself is the "ticket"). */
    @GetMapping("/{orderId}")
    @SecurityRequirements
    public ResponseEntity<OrderFrontendResponse> getOrder(@PathVariable UUID orderId) {
        return ResponseEntity.ok(orderService.getOrderFrontend(orderId));
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<Page<OrderResponse>> getShopOrders(@PathVariable UUID shopId, Pageable pageable) {
        return ResponseEntity.ok(orderService.getShopOrders(shopId, pageable));
    }

    /** Owner dashboard's live queue: active orders for the caller's own shop. Matches LiveQueue.jsx. */
    @GetMapping("/live")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<OrderFrontendResponse>> getLiveOrders(@AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(orderService.getLiveOrdersForOwnerFrontend(principal.getUserId()));
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<OrderFrontendResponse> updateStatus(@PathVariable UUID orderId,
                                                               @Valid @RequestBody OrderStatusUpdateRequest request) {
        return ResponseEntity.ok(orderService.updateStatusFrontend(orderId, request.status()));
    }
}
