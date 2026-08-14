package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.LoginRequest;
import com.foodplatform.backend.dto.request.RegisterRequest;
import com.foodplatform.backend.dto.response.AuthResponse;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.entity.ShopTheme;
import com.foodplatform.backend.entity.User;
import com.foodplatform.backend.entity.enums.ServiceType;
import com.foodplatform.backend.entity.enums.ShopStatus;
import com.foodplatform.backend.entity.enums.UserRole;
import com.foodplatform.backend.exception.DuplicateResourceException;
import com.foodplatform.backend.repository.ShopRepository;
import com.foodplatform.backend.repository.ShopThemeRepository;
import com.foodplatform.backend.repository.UserRepository;
import com.foodplatform.backend.security.AppUserDetails;
import com.foodplatform.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ShopThemeRepository shopThemeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Every registration through the public /auth/register endpoint creates a
     * shop OWNER account plus their shop (and a blank default theme) in one
     * step - the frontend never makes a separate "create shop" call.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .name(request.shopName())
                .email(request.email())
                .phone(request.phone())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.OWNER)
                .isVerified(false)
                .build();
        user = userRepository.save(user);

        Shop shop = Shop.builder()
                .owner(user)
                .shopName(request.shopName())
                .slug(generateUniqueSlug(request.shopName()))
                .serviceType(request.serviceType() != null ? request.serviceType() : ServiceType.DINE_IN)
                .templateId("classic")
                .status(ShopStatus.APPROVED)
                .build();
        shop = shopRepository.save(shop);

        shopThemeRepository.save(ShopTheme.builder()
                .shop(shop)
                .themeName("default")
                .primaryColor("#FA4616")
                .showAbout(true)
                .showGallery(true)
                .build());

        AppUserDetails userDetails = new AppUserDetails(user);
        String token = jwtService.generateToken(userDetails, user.getUserId().toString(), user.getRole().name());

        return AuthResponse.of(token, user.getUserId(), user.getName(), user.getEmail(), user.getRole());
    }

    /** Turns "Tasty Bites!" into "tasty-bites", appending -2, -3, ... on collision. */
    private String generateUniqueSlug(String shopName) {
        String base = shopName.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (base.isBlank()) base = "shop";
        String candidate = base;
        int suffix = 2;
        while (shopRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalStateException("User disappeared after successful authentication"));

        AppUserDetails userDetails = new AppUserDetails(user);
        String token = jwtService.generateToken(userDetails, user.getUserId().toString(), user.getRole().name());

        return AuthResponse.of(token, user.getUserId(), user.getName(), user.getEmail(), user.getRole());
    }
}
