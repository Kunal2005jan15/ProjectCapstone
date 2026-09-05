package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank String categoryName,
        String description,
        Integer displayOrder,
        Boolean isActive
) {}
