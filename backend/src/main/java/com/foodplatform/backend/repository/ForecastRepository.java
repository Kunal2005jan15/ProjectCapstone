package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.Forecast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ForecastRepository extends JpaRepository<Forecast, UUID> {
    List<Forecast> findByShop_ShopIdAndForecastDate(UUID shopId, LocalDate forecastDate);
    Optional<Forecast> findTopByShop_ShopIdAndMenuItem_ItemIdOrderByForecastDateDesc(UUID shopId, UUID itemId);
    List<Forecast> findByShop_ShopIdAndMenuItem_ItemIdAndForecastDateBetween(
            UUID shopId, UUID itemId, LocalDate from, LocalDate to);
}
