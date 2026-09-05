package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.PaymentCreateRequest;
import com.foodplatform.backend.dto.request.PaymentVerifyRequest;
import com.foodplatform.backend.dto.response.PaymentConfigResponse;
import com.foodplatform.backend.dto.response.PaymentCreateResponse;
import com.foodplatform.backend.dto.response.PaymentVerifyResponse;
import com.foodplatform.backend.service.PaymentService;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public, no-login payment endpoints for the guest checkout flow (Checkout.jsx).
 * See PaymentService for the payment-off-vs-real-Razorpay explanation.
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@SecurityRequirements
@Tag(name = "Payments", description = "Guest checkout payment flow (temporarily payment-off unless Razorpay is configured)")
public class PaymentController {

    private final PaymentService paymentService;

    /** Lets the frontend show "Payment Off" messaging before checkout starts. */
    @GetMapping("/config")
    public ResponseEntity<PaymentConfigResponse> config() {
        return ResponseEntity.ok(paymentService.getConfig());
    }

    @PostMapping("/create")
    public ResponseEntity<PaymentCreateResponse> create(@Valid @RequestBody PaymentCreateRequest request) {
        return ResponseEntity.ok(paymentService.create(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<PaymentVerifyResponse> verify(@Valid @RequestBody PaymentVerifyRequest request) {
        return ResponseEntity.ok(paymentService.verify(request));
    }
}
