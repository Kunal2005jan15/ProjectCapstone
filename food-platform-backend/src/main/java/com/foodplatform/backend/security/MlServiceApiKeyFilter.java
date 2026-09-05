package com.foodplatform.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Grants a scoped, machine-only "SERVICE" role to the ml-service's forecast
 * pushes (POST /api/v1/shops/{shopId}/forecasts), authenticated via a
 * dedicated X-ML-Service-Key header — NOT the Authorization header, so this
 * never interacts with {@link JwtAuthenticationFilter} or real user JWTs at
 * all. Every other endpoint's auth is completely untouched by this filter:
 * it only ever acts on this one path + method, and only when the header is
 * present and correct; otherwise it's a no-op and the request proceeds
 * through the normal JWT flow exactly as before.
 *
 * Disabled by default (no-op) unless app.ml.push-api-key (env
 * ML_PUSH_API_KEY) is configured — so deploying this change with no key set
 * changes nothing about current behavior; the forecasts endpoint simply
 * stays OWNER/ADMIN-only until a key is set.
 */
@Component
public class MlServiceApiKeyFilter extends OncePerRequestFilter {

    private static final String HEADER_NAME = "X-ML-Service-Key";
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
    private static final String FORECAST_PATH_PATTERN = "/api/v1/shops/*/forecasts";

    @Value("${app.ml-service.push-api-key:}")
    private String configuredApiKey;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        boolean isForecastPush = "POST".equalsIgnoreCase(request.getMethod())
                && PATH_MATCHER.match(FORECAST_PATH_PATTERN, request.getRequestURI());

        if (!isForecastPush || configuredApiKey == null || configuredApiKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        String presentedKey = request.getHeader(HEADER_NAME);
        if (presentedKey != null
                && SecurityContextHolder.getContext().getAuthentication() == null
                && constantTimeEquals(presentedKey, configuredApiKey)) {

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    "ml-service", null, List.of(new SimpleGrantedAuthority("ROLE_SERVICE")));
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authToken);
            SecurityContextHolder.setContext(context);
        }

        filterChain.doFilter(request, response);
    }

    /** Avoids timing attacks on the key comparison. */
    private boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
