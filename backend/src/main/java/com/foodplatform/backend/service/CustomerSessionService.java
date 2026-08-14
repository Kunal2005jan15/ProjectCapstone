package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.request.SessionRequest;
import com.foodplatform.backend.dto.response.SessionResponse;
import com.foodplatform.backend.entity.Customer;
import com.foodplatform.backend.entity.CustomerSession;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.exception.ResourceNotFoundException;
import com.foodplatform.backend.repository.CustomerRepository;
import com.foodplatform.backend.repository.CustomerSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Creates a lightweight session the moment a customer scans a shop's QR code,
 * so the platform can track behaviour/recommendations without forcing login
 * (per the proposal's no-login ordering requirement).
 */
@Service
@RequiredArgsConstructor
public class CustomerSessionService {

    private final CustomerSessionRepository sessionRepository;
    private final CustomerRepository customerRepository;
    private final ShopService shopService;

    @Transactional
    public SessionResponse startSession(SessionRequest request) {
        Shop shop = shopService.findShopOrThrow(request.shopId());

        Customer customer = null;
        if (request.customerPhone() != null && !request.customerPhone().isBlank()) {
            customer = customerRepository.findByPhone(request.customerPhone())
                    .orElseGet(() -> customerRepository.save(
                            Customer.builder()
                                    .name(request.customerName())
                                    .phone(request.customerPhone())
                                    .build()));
        }

        CustomerSession session = CustomerSession.builder()
                .shop(shop)
                .customer(customer)
                .deviceType(request.deviceType())
                .lastActiveAt(LocalDateTime.now())
                .build();

        return SessionResponse.from(sessionRepository.save(session));
    }

    @Transactional
    public void touchSession(UUID sessionId) {
        CustomerSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        session.setLastActiveAt(LocalDateTime.now());
        sessionRepository.save(session);
    }
}
