package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.Forecast;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ForecastResponse(
        UUID forecastId,
        UUID shopId,
        UUID itemId,
        String itemName,
        LocalDate forecastDate,
        BigDecimal predictedQuantity,
        BigDecimal lowerBound,
        BigDecimal upperBound,
        String modelName,
        String modelVersion
) {
    public static ForecastResponse from(Forecast f) {
        return new ForecastResponse(
                f.getForecastId(), f.getShop().getShopId(), f.getMenuItem().getItemId(),
                f.getMenuItem().getItemName(), f.getForecastDate(), f.getPredictedQuantity(),
                f.getLowerBound(), f.getUpperBound(), f.getModelName(), f.getModelVersion()
        );
    }
}
