package com.foodplatform.backend.config;

import com.foodplatform.backend.security.AppUserDetailsService;
import com.foodplatform.backend.security.JwtAuthenticationFilter;
import com.foodplatform.backend.security.MlServiceApiKeyFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AppUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final MlServiceApiKeyFilter mlServiceApiKeyFilter;

    // app.cors.allowed-origins (env CORS_ALLOWED_ORIGINS), comma-separated.
    // Defaults (see application.yml) already include the Vite dev server
    // origins (http://localhost:3000, http://localhost:5173).
    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOriginsProperty;

    // Public GET endpoints
    private static final String[] PUBLIC_GET_ENDPOINTS = {
            "/api/v1/shops/*/public",
            "/api/v1/shops/*/menu",
            "/api/v1/shops/*/menu/*",
            "/api/v1/shops/*/categories",
            "/api/v1/shops/*/theme",
            "/api/v1/shops/*/trending",
            "/api/v1/shops/*/recommendations",
            "/api/v1/storefront/*",
            "/api/v1/orders/*"
    };

    // Public endpoints
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/auth/**",
            "/api/v1/payments/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/actuator/health"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/sessions",
                                "/api/v1/orders/guest"
                        ).permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/shops/*/forecasts")
                                .hasAnyRole("OWNER", "ADMIN", "SERVICE")
                        .requestMatchers("/api/v1/shops/**").hasAnyRole("OWNER", "ADMIN")
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(
                mlServiceApiKeyFilter,
                UsernamePasswordAuthenticationFilter.class
                )       
                .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
                );
        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Local dev origins come from app.cors.allowed-origins (CORS_ALLOWED_ORIGINS
        // env var), production origins are the Vercel deployment. Both are allowed
        // so local dev (Vite on :5173/:3000) works without touching prod config.
        List<String> allowedOrigins = new ArrayList<>();
        if (allowedOriginsProperty != null && !allowedOriginsProperty.isBlank()) {
            allowedOrigins.addAll(Arrays.stream(allowedOriginsProperty.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList());
        }

        configuration.setAllowedOriginPatterns(allowedOrigins);
        configuration.addAllowedOriginPattern("https://dine-shop-ai.vercel.app");
        configuration.addAllowedOriginPattern("https://*.vercel.app");

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}