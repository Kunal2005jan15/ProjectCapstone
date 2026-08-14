package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.ForecastRequest;
import com.foodplatform.backend.dto.response.ForecastResponse;
import com.foodplatform.backend.service.ForecastService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shops/{shopId}/forecasts")
@RequiredArgsConstructor
@Tag(name = "Forecasts", description = "Demand forecasts produced by the Prophet-based ML service")
public class ForecastController {

    private final ForecastService forecastService;

    /** Called by the FastAPI/Prophet ML service to push a computed forecast. */
    @PostMapping
    public ResponseEntity<ForecastResponse> save(@PathVariable UUID shopId,
                                                  @Valid @RequestBody ForecastRequest request) {
        return ResponseEntity.ok(forecastService.saveForecast(shopId, request));
    }

    @GetMapping
    public ResponseEntity<List<ForecastResponse>> getForDate(
            @PathVariable UUID shopId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(forecastService.getForecastsForDate(shopId, date));
    }

    @GetMapping("/items/{itemId}/latest")
    public ResponseEntity<ForecastResponse> getLatest(@PathVariable UUID shopId, @PathVariable UUID itemId) {
        return ResponseEntity.ok(forecastService.getLatestForecast(shopId, itemId));
    }
}
