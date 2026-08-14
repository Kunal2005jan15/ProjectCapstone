package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.CustomerSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CustomerSessionRepository extends JpaRepository<CustomerSession, UUID> {
}
