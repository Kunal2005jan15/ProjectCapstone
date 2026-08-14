package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.RestaurantTable;

import java.util.UUID;

/**
 * Shape matches TableManagement.jsx: table.id, table.number, table.seats, table.active.
 */
public record TableResponse(
        UUID id,
        Integer number,
        Integer seats,
        boolean active
) {
    public static TableResponse from(RestaurantTable t) {
        return new TableResponse(
                t.getTableId(),
                t.getTableNumber(),
                t.getSeats(),
                t.isActive()
        );
    }
}
