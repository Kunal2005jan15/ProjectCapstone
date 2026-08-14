package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.SessionRequest;
import com.foodplatform.backend.dto.response.SessionResponse;
import com.foodplatform.backend.service.CustomerSessionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Tag(name = "Customer Sessions", description = "No-login session tracking, created on QR scan")
@SecurityRequirements
public class SessionController {

    private final CustomerSessionService sessionService;

    @PostMapping
    public ResponseEntity<SessionResponse> start(@Valid @RequestBody SessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.startSession(request));
    }

    @PatchMapping("/{sessionId}/touch")
    public ResponseEntity<Void> touch(@PathVariable UUID sessionId) {
        sessionService.touchSession(sessionId);
        return ResponseEntity.noContent().build();
    }
}
