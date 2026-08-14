package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.response.DashboardStatsResponse;
import com.foodplatform.backend.security.AppUserDetails;
import com.foodplatform.backend.service.AnalyticsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
@Tag(name = "Analytics", description = "Aggregate stats and charts for the owner dashboard")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<DashboardStatsResponse> overview(@AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(analyticsService.getOverviewForOwner(principal.getUserId()));
    }
}
