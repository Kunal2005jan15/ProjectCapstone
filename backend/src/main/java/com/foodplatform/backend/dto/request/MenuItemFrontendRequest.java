package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Body of POST/PUT /api/v1/menu, exactly matching MenuManagement.jsx's form:
 * { name, description, price, category, active }. `category` is a free-text
 * name; the service resolves or creates a matching Category behind the scenes.
 */
public record MenuItemFrontendRequest(
        @NotBlank String name,
        String description,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        String category,
        Boolean active
) {}
