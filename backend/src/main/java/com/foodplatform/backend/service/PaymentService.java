package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.PaymentCreateRequest;
import com.foodplatform.backend.dto.request.PaymentVerifyRequest;
import com.foodplatform.backend.dto.response.PaymentCreateResponse;
import com.foodplatform.backend.dto.response.PaymentVerifyResponse;
import com.foodplatform.backend.entity.enums.PaymentMethod;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Backs Checkout.jsx's payment step (POST /payments/create then /payments/verify).
 *
 * No Razorpay account/keys ship with this project, so by default this runs in
 * "mock" mode: /payments/create returns mock=true and a fake razorpayOrderId,
 * and the frontend (see Checkout.jsx) skips the real Razorpay widget and calls
 * /payments/verify immediately, which just marks the order PAID.
 *
 * To use real Razorpay, set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET env vars and
 * (for production) verify the HMAC signature in verify() instead of trusting
 * the client - this demo intentionally skips signature verification since
 * there is nothing real to verify in mock mode.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderService orderService;

    @Value("${app.razorpay.key-id:}")
    private String razorpayKeyId;

    public PaymentCreateResponse create(PaymentCreateRequest request) {
        boolean mock = razorpayKeyId == null || razorpayKeyId.isBlank();
        String orderRef = mock
                ? "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14)
                : razorpayKeyId; // real integration would call the Razorpay Orders API here

        return new PaymentCreateResponse(
                mock ? "mock_key" : razorpayKeyId,
                request.amount(),
                orderRef,
                request.orderId(),
                mock
        );
    }

    public PaymentVerifyResponse verify(PaymentVerifyRequest request) {
        // Real integration: recompute the HMAC-SHA256 signature from
        // razorpay_order_id + "|" + razorpay_payment_id using the key secret
        // and compare against razorpay_signature before trusting this call.
        orderService.markPaid(request.orderId(), PaymentMethod.UPI);
        return new PaymentVerifyResponse("success", request.orderId());
    }
}
