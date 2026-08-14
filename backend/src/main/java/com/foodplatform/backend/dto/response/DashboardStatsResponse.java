package com.foodplatform.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Shape matches the owner dashboard's Dashboard.jsx exactly (field names included)
 * so the frontend needs no further mapping.
 */
public record DashboardStatsResponse(
        long totalOrders,
        BigDecimal totalSales,
        BigDecimal avgOrderValue,
        long newCustomers,
        List<TrendPoint> orderTrend,
        List<StatusSlice> statusBreakdown,
        List<RecentOrder> recentOrders,
        List<TopItem> topItems
) {
    public record TrendPoint(String date, long orders) {}
    public record StatusSlice(String name, long value) {}
    public record RecentOrder(String id, int itemCount, BigDecimal total, String status) {}
    public record TopItem(String name, long orderCount) {}
}
