package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.ForecastRequest;
import com.foodplatform.backend.dto.response.ForecastResponse;
import com.foodplatform.backend.entity.Forecast;
import com.foodplatform.backend.entity.MenuItem;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.repository.ForecastRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Stores forecast results produced by the Python/FastAPI + Prophet ML service
 * (see proposal section 8.1) and serves them back to the owner dashboard.
 * This service does NOT run Prophet itself -- that lives in the separate
 * ML microservice; this is the persistence + retrieval layer on the Spring side.
 */
@Service
@RequiredArgsConstructor
public class ForecastService {

    private final ForecastRepository forecastRepository;
    private final ShopService shopService;
    private final MenuItemService menuItemService;

    @Transactional
    public ForecastResponse saveForecast(UUID shopId, ForecastRequest request) {
        Shop shop = shopService.findShopOrThrow(shopId);
        MenuItem item = menuItemService.findItemOrThrow(request.itemId());

        Forecast forecast = Forecast.builder()
                .shop(shop)
                .menuItem(item)
                .forecastDate(request.forecastDate())
                .predictedQuantity(request.predictedQuantity())
                .lowerBound(request.lowerBound())
                .upperBound(request.upperBound())
                .modelName(request.modelName() != null ? request.modelName() : "prophet")
                .modelVersion(request.modelVersion())
                .build();

        return ForecastResponse.from(forecastRepository.save(forecast));
    }

    public List<ForecastResponse> getForecastsForDate(UUID shopId, LocalDate date) {
        return forecastRepository.findByShop_ShopIdAndForecastDate(shopId, date)
                .stream().map(ForecastResponse::from).toList();
    }

    public ForecastResponse getLatestForecast(UUID shopId, UUID itemId) {
        return forecastRepository.findTopByShop_ShopIdAndMenuItem_ItemIdOrderByForecastDateDesc(shopId, itemId)
                .map(ForecastResponse::from)
                .orElse(null);
    }
}
