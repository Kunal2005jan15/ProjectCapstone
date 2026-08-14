package com.foodplatform.backend.dto.response;

import com.foodplatform.backend.entity.QrCode;

import java.util.UUID;

public record QrCodeResponse(
        UUID qrId,
        UUID shopId,
        String qrCodeUrl,
        String targetUrl,
        String location,
        boolean isActive,
        String qrImageBase64
) {
    public static QrCodeResponse from(QrCode q, String base64Image) {
        return new QrCodeResponse(
                q.getQrId(), q.getShop().getShopId(), q.getQrCodeUrl(),
                q.getTargetUrl(), q.getLocation(), q.isActive(), base64Image
        );
    }
}
