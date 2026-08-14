package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Used by the ML service (or manually) to push a forecast result into the backend. */
public record ForecastRequest(
        @NotNull UUID itemId,
        @NotNull LocalDate forecastDate,
        @NotNull BigDecimal predictedQuantity,
        BigDecimal lowerBound,
        BigDecimal upperBound,
        String modelName,
        String modelVersion
) {}
