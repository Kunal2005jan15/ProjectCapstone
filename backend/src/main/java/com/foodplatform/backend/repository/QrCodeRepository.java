package com.foodplatform.backend.repository;

import com.foodplatform.backend.entity.QrCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QrCodeRepository extends JpaRepository<QrCode, UUID> {
    List<QrCode> findByShop_ShopId(UUID shopId);
}
