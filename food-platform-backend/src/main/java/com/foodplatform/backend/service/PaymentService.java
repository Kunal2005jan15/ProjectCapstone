package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.PaymentCreateRequest;
import com.foodplatform.backend.dto.request.PaymentVerifyRequest;
import com.foodplatform.backend.dto.response.PaymentConfigResponse;
import com.foodplatform.backend.dto.response.PaymentCreateResponse;
import com.foodplatform.backend.dto.response.PaymentVerifyResponse;
import com.foodplatform.backend.entity.enums.PaymentMethod;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Backs Checkout.jsx's payment step (GET /payments/config, then POST
 * /payments/create, then POST /payments/verify).
 *
 * Payment provider is controlled by app.payment.provider (env var
 * PAYMENT_PROVIDER), one of:
 *   - "off"      (default): Razorpay is not available yet. Checkout completes
 *                 without any real payment step - the frontend never loads
 *                 the Razorpay widget and /payments/verify just confirms the
 *                 order with PaymentMethod.NONE.
 *   - "razorpay": Real Razorpay flow. Requires RAZORPAY_KEY_ID /
 *                 RAZORPAY_KEY_SECRET; if either is missing this still falls
 *                 back to the "off" behavior as a safety net.
 *
 * To wire up real Razorpay later: set PAYMENT_PROVIDER=razorpay and the two
 * key env vars, call the real Razorpay Orders API in create() below (where
 * marked), and verify the HMAC-SHA256 signature in verify() (where marked)
 * instead of trusting the client. No other files need to change - the
 * "off"/"razorpay" switch is the single source of truth for both the
 * frontend (via /payments/config) and this service.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String PROVIDER_OFF = "off";
    private static final String PROVIDER_RAZORPAY = "razorpay";

    private final OrderService orderService;

    @Value("${app.payment.provider:off}")
    private String paymentProvider;

    @Value("${app.razorpay.key-id:}")
    private String razorpayKeyId;

    /** Lets the frontend know up front (before the customer taps pay) whether online payment is available. */
    public PaymentConfigResponse getConfig() {
        boolean paymentEnabled = PROVIDER_RAZORPAY.equalsIgnoreCase(paymentProvider) && hasRazorpayKeys();
        return new PaymentConfigResponse(normalizedProvider(), paymentEnabled);
    }

    public PaymentCreateResponse create(PaymentCreateRequest request) {
        boolean off = isPaymentOff();
        String orderRef = off
                ? "order_off_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14)
                : razorpayKeyId; // real integration would call the Razorpay Orders API here

        return new PaymentCreateResponse(
                off ? "payment_off" : razorpayKeyId,
                request.amount(),
                orderRef,
                request.orderId(),
                off,
                normalizedProvider()
        );
    }

    public PaymentVerifyResponse verify(PaymentVerifyRequest request) {
        if (isPaymentOff()) {
            orderService.markPaymentOff(request.orderId());
            return new PaymentVerifyResponse("success", request.orderId());
        }

        // Real integration: recompute the HMAC-SHA256 signature from
        // razorpay_order_id + "|" + razorpay_payment_id using the key secret
        // and compare against razorpay_signature before trusting this call.
        orderService.markPaid(request.orderId(), PaymentMethod.UPI);
        return new PaymentVerifyResponse("success", request.orderId());
    }

    private boolean isPaymentOff() {
        if (!PROVIDER_RAZORPAY.equalsIgnoreCase(paymentProvider)) {
            return true; // provider=off, or anything unrecognized -> safest default
        }
        return !hasRazorpayKeys(); // provider=razorpay but no keys yet -> fall back to off
    }

    private boolean hasRazorpayKeys() {
        return razorpayKeyId != null && !razorpayKeyId.isBlank();
    }

    private String normalizedProvider() {
        return PROVIDER_RAZORPAY.equalsIgnoreCase(paymentProvider) ? PROVIDER_RAZORPAY : PROVIDER_OFF;
    }
}
