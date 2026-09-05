package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findFirstByPhoneOrderByCreatedAtAsc(String phone);
}
