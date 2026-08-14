package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.response.DashboardStatsResponse;
import com.foodplatform.backend.dto.response.DashboardStatsResponse.RecentOrder;
import com.foodplatform.backend.dto.response.DashboardStatsResponse.StatusSlice;
import com.foodplatform.backend.dto.response.DashboardStatsResponse.TopItem;
import com.foodplatform.backend.dto.response.DashboardStatsResponse.TrendPoint;
import com.foodplatform.backend.entity.Order;
import com.foodplatform.backend.entity.OrderItem;
import com.foodplatform.backend.entity.enums.OrderStatus;
import com.foodplatform.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Owner dashboard's stats card + charts. This walks the shop's full order
 * history in memory rather than running several aggregate SQL queries - simple
 * and correct for a project at this scale; worth revisiting with real SQL
 * aggregation (SUM/GROUP BY) if order volume grows large.
 */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("MMM d");

    private final OrderRepository orderRepository;
    private final ShopService shopService;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getOverviewForOwner(UUID ownerId) {
        UUID shopId = shopService.getCurrentShopForOwner(ownerId).getShopId();
        List<Order> allOrders = orderRepository.findByShop_ShopIdOrderByOrderTimestampDesc(shopId);

        List<Order> validOrders = allOrders.stream()
                .filter(o -> o.getOrderStatus() != OrderStatus.CANCELLED)
                .toList();

        long totalOrders = allOrders.size();
        BigDecimal totalSales = validOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avgOrderValue = validOrders.isEmpty()
                ? BigDecimal.ZERO
                : totalSales.divide(BigDecimal.valueOf(validOrders.size()), 2, RoundingMode.HALF_UP);

        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        long newCustomers = allOrders.stream()
                .filter(o -> o.getCustomer() != null)
                .filter(o -> !o.getOrderTimestamp().toLocalDate().isBefore(thirtyDaysAgo))
                .map(o -> o.getCustomer().getCustomerId())
                .distinct()
                .count();

        List<TrendPoint> orderTrend = buildOrderTrend(allOrders);
        List<StatusSlice> statusBreakdown = buildStatusBreakdown(allOrders);
        List<RecentOrder> recentOrders = allOrders.stream()
                .limit(5)
                .map(this::toRecentOrder)
                .toList();
        List<TopItem> topItems = buildTopItems(validOrders);

        return new DashboardStatsResponse(
                totalOrders, totalSales, avgOrderValue, newCustomers,
                orderTrend, statusBreakdown, recentOrders, topItems
        );
    }

    private List<TrendPoint> buildOrderTrend(List<Order> orders) {
        // Last 7 days, oldest first, so the line chart reads left-to-right.
        Map<LocalDate, Long> countsByDay = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            countsByDay.put(LocalDate.now().minusDays(i), 0L);
        }
        for (Order o : orders) {
            LocalDate day = o.getOrderTimestamp().toLocalDate();
            if (countsByDay.containsKey(day)) {
                countsByDay.merge(day, 1L, Long::sum);
            }
        }
        return countsByDay.entrySet().stream()
                .map(e -> new TrendPoint(e.getKey().format(DAY_FORMAT), e.getValue()))
                .toList();
    }

    private List<StatusSlice> buildStatusBreakdown(List<Order> orders) {
        Map<OrderStatus, Long> counts = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            counts.put(status, 0L);
        }
        for (Order o : orders) {
            counts.merge(o.getOrderStatus(), 1L, Long::sum);
        }
        return counts.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .map(e -> new StatusSlice(displayStatus(e.getKey()), e.getValue()))
                .toList();
    }

    private List<TopItem> buildTopItems(List<Order> orders) {
        Map<String, Long> quantityByItemName = new LinkedHashMap<>();
        for (Order o : orders) {
            for (OrderItem oi : o.getItems()) {
                quantityByItemName.merge(oi.getMenuItem().getItemName(),
                        (long) oi.getQuantity(), Long::sum);
            }
        }
        return quantityByItemName.entrySet().stream()
                .sorted(Comparator.<Map.Entry<String, Long>>comparingLong(Map.Entry::getValue).reversed())
                .limit(5)
                .map(e -> new TopItem(e.getKey(), e.getValue()))
                .toList();
    }

    private RecentOrder toRecentOrder(Order o) {
        return new RecentOrder(
                o.getOrderId().toString().substring(0, 8),
                o.getItems().size(),
                o.getTotalAmount(),
                displayStatus(o.getOrderStatus())
        );
    }

    private String displayStatus(OrderStatus status) {
        String lower = status.name().toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
