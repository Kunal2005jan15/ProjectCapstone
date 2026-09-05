package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.response.RecommendationResponse;
import com.foodplatform.backend.dto.response.TrendingItemResponse;
import com.foodplatform.backend.service.RecommendationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shops/{shopId}")
@RequiredArgsConstructor
@Tag(name = "Recommendations & Trending", description = "Rule-based personalization: reorder-usual, popularity, trending")
@SecurityRequirements
public class RecommendationController {

    private final RecommendationService recommendationService;

    /** Rolling 7-day (default) trending items - public, powers the customer-facing menu. */
    @GetMapping("/trending")
    public ResponseEntity<List<TrendingItemResponse>> trending(
            @PathVariable UUID shopId, @RequestParam(defaultValue = "7") int windowDays) {
        return ResponseEntity.ok(recommendationService.getTrendingItems(shopId, windowDays));
    }

    /** "Reorder your usual" for known customers, popularity fallback for new/anonymous ones. */
    @GetMapping("/recommendations")
    public ResponseEntity<List<RecommendationResponse>> recommendations(
            @PathVariable UUID shopId, @RequestParam(required = false) UUID customerId) {
        return ResponseEntity.ok(recommendationService.getRecommendationsForCustomer(shopId, customerId));
    }
}
