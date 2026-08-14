package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.enums.UserRole;

import java.util.UUID;

/**
 * Shape matches AuthContext.jsx exactly: res.data.token and res.data.user
 * (with user.id, user.name, user.email, user.role).
 */
public record AuthResponse(
        String token,
        UserInfo user
) {
    public record UserInfo(UUID id, String name, String email, UserRole role) {}

    public static AuthResponse of(String token, UUID id, String name, String email, UserRole role) {
        return new AuthResponse(token, new UserInfo(id, name, email, role));
    }
}
