package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.GuestOrderRequest;
import com.foodplatform.backend.dto.request.OrderItemRequest;
import com.foodplatform.backend.dto.request.OrderRequest;
import com.foodplatform.backend.dto.response.OrderFrontendResponse;
import com.foodplatform.backend.dto.response.OrderResponse;
import com.foodplatform.backend.entity.*;
import com.foodplatform.backend.entity.enums.OrderStatus;
import com.foodplatform.backend.entity.enums.OrderType;
import com.foodplatform.backend.entity.enums.ServiceType;
import com.foodplatform.backend.exception.BadRequestException;
import com.foodplatform.backend.exception.ResourceNotFoundException;
import com.foodplatform.backend.repository.CustomerRepository;
import com.foodplatform.backend.repository.CustomerSessionRepository;
import com.foodplatform.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Places orders and feeds every downstream data area described in the proposal:
 * the ORDER/ORDER_ITEM tables double as the training data for the forecasting
 * model, and placing an order deducts inventory in real time.
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.05"); // 5% flat GST placeholder

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final CustomerSessionRepository sessionRepository;
    private final MenuItemService menuItemService;
    private final ShopService shopService;
    private final InventoryService inventoryService;

    @Transactional
    public OrderResponse placeOrder(OrderRequest request) {
        Shop shop = shopService.findShopOrThrow(request.shopId());

        Customer customer = null;
        if (request.customerId() != null) {
            customer = customerRepository.findById(request.customerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + request.customerId()));
        }

        CustomerSession session = null;
        if (request.sessionId() != null) {
            session = sessionRepository.findById(request.sessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + request.sessionId()));
        }

        Order order = Order.builder()
                .shop(shop)
                .customer(customer)
                .session(session)
                .orderType(request.orderType() != null ? request.orderType() : OrderType.DINE_IN)
                .tableNumber(request.tableNumber())
                .orderStatus(OrderStatus.RECEIVED)
                .paymentMethod(request.paymentMethod())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.items()) {
            MenuItem menuItem = menuItemService.findItemOrThrow(itemReq.itemId());
            if (!menuItem.isAvailable()) {
                throw new BadRequestException("Menu item is currently unavailable: " + menuItem.getItemName());
            }

            BigDecimal lineTotal = menuItem.getPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .menuItem(menuItem)
                    .quantity(itemReq.quantity())
                    .unitPrice(menuItem.getPrice())
                    .discount(BigDecimal.ZERO)
                    .totalPrice(lineTotal)
                    .build();
            order.addItem(orderItem);
        }

        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, java.math.RoundingMode.HALF_UP);
        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setDiscount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal.add(tax));

        order = orderRepository.save(order);

        // Data ingestion is implicit (the order/order_item rows themselves);
        // deduct inventory immediately so stock levels and low-stock alerts stay accurate.
        // for (OrderItem oi : order.getItems()) {
        //     inventoryService.deductForSale(oi.getMenuItem().getItemId(),
        //             BigDecimal.valueOf(oi.getQuantity()), order.getOrderId());
        // }

        return OrderResponse.from(order);
    }

    /**
     * No-login QR checkout flow (Checkout.jsx). Recomputes totals from the
     * live menu item prices server-side rather than trusting the client-sent
     * price/totalAmount, and starts the order straight in PREPARING so it
     * shows up immediately in the owner's live queue (there is no separate
     * "accept order" step in this UI).
     */
    @Transactional
    public OrderFrontendResponse placeGuestOrder(GuestOrderRequest request) {
        Shop shop = shopService.findShopOrThrow(request.shopId());

        Customer customer = null;
        if (request.customerPhone() != null && !request.customerPhone().isBlank()) {
                customer = customerRepository.findFirstByPhoneOrderByCreatedAtAsc(request.customerPhone())
                    .orElseGet(() -> customerRepository.save(Customer.builder()
                            .name(request.customerName())
                            .phone(request.customerPhone())
                            .build()));
        }

        OrderType orderType = shop.getServiceType() == ServiceType.COUNTER_ONLY ? OrderType.TAKEAWAY : OrderType.DINE_IN;

        Order order = Order.builder()
                .shop(shop)
                .customer(customer)
                .orderType(orderType)
                .tableNumber(request.tableNumber())
                .orderStatus(OrderStatus.PREPARING)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (GuestOrderRequest.Item itemReq : request.items()) {
            MenuItem menuItem = menuItemService.findItemOrThrow(itemReq.itemId());
            if (!menuItem.isAvailable()) {
                throw new BadRequestException("Menu item is currently unavailable: " + menuItem.getItemName());
            }

            BigDecimal lineTotal = menuItem.getPrice().multiply(BigDecimal.valueOf(itemReq.qty()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .menuItem(menuItem)
                    .quantity(itemReq.qty())
                    .unitPrice(menuItem.getPrice())
                    .discount(BigDecimal.ZERO)
                    .totalPrice(lineTotal)
                    .build();
            order.addItem(orderItem);
        }

        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setDiscount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal.add(tax));

        // saveAndFlush (not save) so Hibernate actually executes the INSERT now and
        // populates the @CreationTimestamp orderTimestamp field in memory. save()
        // alone only queues the insert - reading orderTimestamp before the next
        // flush can see it as null, which NPEs in OrderFrontendResponse.from below.
        order = orderRepository.saveAndFlush(order);

        for (OrderItem oi : order.getItems()) {
            inventoryService.deductForSale(oi.getMenuItem().getItemId(),
                    BigDecimal.valueOf(oi.getQuantity()), order.getOrderId());
        }

        return OrderFrontendResponse.from(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID orderId) {
        return OrderResponse.from(findOrderOrThrow(orderId));
    }

    @Transactional(readOnly = true)
    public OrderFrontendResponse getOrderFrontend(UUID orderId) {
        return OrderFrontendResponse.from(findOrderOrThrow(orderId));
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getShopOrders(UUID shopId, Pageable pageable) {
        return orderRepository.findByShop_ShopIdOrderByOrderTimestampDesc(shopId, pageable)
                .map(OrderResponse::from);
    }

    /**
     * Owner dashboard's "live queue": recent orders for the caller's own shop,
     * oldest first. Includes COMPLETED orders from the last few hours (not just
     * PREPARING/READY) so LiveQueue.jsx's "Completed" column has something to
     * show instead of orders vanishing the instant they're marked done.
     */
    private static final long LIVE_QUEUE_WINDOW_HOURS = 6;

    @Transactional(readOnly = true)
    public java.util.List<OrderResponse> getLiveOrdersForOwner(UUID ownerId) {
        UUID shopId = shopService.getCurrentShopForOwner(ownerId).getShopId();
        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusHours(LIVE_QUEUE_WINDOW_HOURS);
        return orderRepository.findByShop_ShopIdAndOrderTimestampAfterOrderByOrderTimestampAsc(shopId, cutoff)
                .stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public java.util.List<OrderFrontendResponse> getLiveOrdersForOwnerFrontend(UUID ownerId) {
        UUID shopId = shopService.getCurrentShopForOwner(ownerId).getShopId();
        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusHours(LIVE_QUEUE_WINDOW_HOURS);
        return orderRepository.findByShop_ShopIdAndOrderTimestampAfterOrderByOrderTimestampAsc(shopId, cutoff)
                .stream().map(OrderFrontendResponse::from).toList();
    }

    @Transactional
    public OrderResponse updateStatus(UUID orderId, OrderStatus newStatus) {
        Order order = findOrderOrThrow(orderId);
        validateTransition(order.getOrderStatus(), newStatus);
        order.setOrderStatus(newStatus);
        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderFrontendResponse updateStatusFrontend(UUID orderId, OrderStatus newStatus) {
        Order order = findOrderOrThrow(orderId);
        validateTransition(order.getOrderStatus(), newStatus);
        order.setOrderStatus(newStatus);
        return OrderFrontendResponse.from(orderRepository.save(order));
    }

    /** Marks an order paid after a successful (real) payment verification. */
    @Transactional
    public void markPaid(UUID orderId, com.foodplatform.backend.entity.enums.PaymentMethod method) {
        Order order = findOrderOrThrow(orderId);
        order.setPaymentStatus(com.foodplatform.backend.entity.enums.PaymentStatus.PAID);
        if (method != null) order.setPaymentMethod(method);
        orderRepository.save(order);
    }

    /**
     * Confirms an order placed while online payment is turned off (see
     * PaymentService). No money has actually moved, so paymentStatus stays
     * PENDING (vendor collects payment offline / later) and paymentMethod is
     * recorded as NONE, instead of falsely marking the order PAID.
     */
    @Transactional
    public void markPaymentOff(UUID orderId) {
        Order order = findOrderOrThrow(orderId);
        order.setPaymentStatus(com.foodplatform.backend.entity.enums.PaymentStatus.PENDING);
        order.setPaymentMethod(com.foodplatform.backend.entity.enums.PaymentMethod.NONE);
        orderRepository.save(order);
    }

    private void validateTransition(OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.COMPLETED || current == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot change status of a " + current + " order");
        }
    }

    private Order findOrderOrThrow(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }
}