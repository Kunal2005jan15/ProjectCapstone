package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.response.RecommendationResponse;
import com.foodplatform.backend.dto.response.TrendingItemResponse;
import com.foodplatform.backend.entity.enums.RecommendationType;
import com.foodplatform.backend.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implements the proposal's rule-based recommendation logic (section 8.4):
 *  - Returning customers -> frequency-based "reorder your usual"
 *  - New customers        -> popularity ranking (same query as trending)
 *  - Trending items       -> rolling 7-day window aggregation (section 7.1 dashboard)
 * None of this is ML; it is intentionally simple, explainable rule-based logic,
 * exactly as the proposal specifies (sections 8.2 and 8.4).
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final int TRENDING_WINDOW_DAYS = 7;
    private static final int MAX_RECOMMENDATIONS = 5;

    private final OrderItemRepository orderItemRepository;

    /** Rolling-window "trending items" - rule-based, not ML (proposal section 8.2). */
    public List<TrendingItemResponse> getTrendingItems(UUID shopId, int windowDays) {
        int days = windowDays > 0 ? windowDays : TRENDING_WINDOW_DAYS;
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        return orderItemRepository.findTrendingItems(shopId, since).stream()
                .limit(MAX_RECOMMENDATIONS)
                .map(p -> new TrendingItemResponse(p.getItemId(), p.getItemName(), p.getTotalQty()))
                .toList();
    }

    /**
     * Frequency-based "reorder your usual" for a known returning customer,
     * falling back to popularity (trending) for new/anonymous customers -
     * the standard cold-start handling described in the proposal.
     */
    public List<RecommendationResponse> getRecommendationsForCustomer(UUID shopId, UUID customerId) {
        if (customerId == null) {
            return popularityFallback(shopId);
        }

        var frequent = orderItemRepository.findFrequentItemsForCustomer(customerId);
        if (frequent.isEmpty()) {
            return popularityFallback(shopId);
        }

        return frequent.stream()
                .limit(MAX_RECOMMENDATIONS)
                .map(p -> new RecommendationResponse(
                        p.getItemId(),
                        p.getItemName(),
                        RecommendationType.REORDER_USUAL,
                        null,
                        "You ordered this " + p.getOrderCount() + " time(s) previously."
                ))
                .toList();
    }

    private List<RecommendationResponse> popularityFallback(UUID shopId) {
        LocalDateTime since = LocalDateTime.now().minusDays(TRENDING_WINDOW_DAYS);
        var trending = orderItemRepository.findTrendingItems(shopId, since);

        long maxQty = trending.stream().mapToLong(t -> t.getTotalQty() == null ? 0 : t.getTotalQty()).max().orElse(1);

        return trending.stream()
                .limit(MAX_RECOMMENDATIONS)
                .map(p -> new RecommendationResponse(
                        p.getItemId(),
                        p.getItemName(),
                        RecommendationType.POPULAR_ITEM,
                        BigDecimal.valueOf(p.getTotalQty()).divide(BigDecimal.valueOf(maxQty), 4, RoundingMode.HALF_UP),
                        "Popular with other customers this week."
                ))
                .toList();
    }
}
