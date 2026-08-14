package com.foodplatform.backend.dto.request;

import jakarta.validation.constraints.Min;

/**
 * Body of POST /api/v1/tables, matching TableManagement.jsx: { seats }.
 * The table number is auto-assigned by the server (next available number
 * for the shop) since the frontend never sends one.
 */
public record TableRequest(
        @Min(1) Integer seats
) {}
