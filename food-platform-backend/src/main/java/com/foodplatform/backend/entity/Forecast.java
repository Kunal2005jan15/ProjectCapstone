package com.foodplatform.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "forecasts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"shop_id", "item_id", "forecast_date", "model_name"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Forecast {

    @Id
    @GeneratedValue
    @Column(name = "forecast_id", updatable = false, nullable = false)
    private UUID forecastId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private MenuItem menuItem;

    @Column(name = "forecast_date", nullable = false)
    private LocalDate forecastDate;

    @Column(name = "predicted_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal predictedQuantity;

    @Column(name = "lower_bound", precision = 12, scale = 2)
    private BigDecimal lowerBound;

    @Column(name = "upper_bound", precision = 12, scale = 2)
    private BigDecimal upperBound;

    @Column(name = "model_name", length = 80)
    private String modelName;

    @Column(name = "model_version", length = 40)
    private String modelVersion;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
