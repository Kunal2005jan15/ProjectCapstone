package com.foodplatform.backend.service;

import com.foodplatform.backend.dto.response.QrCodeResponse;
import com.foodplatform.backend.entity.QrCode;
import com.foodplatform.backend.entity.Shop;
import com.foodplatform.backend.exception.ResourceNotFoundException;
import com.foodplatform.backend.repository.QrCodeRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Generates one QR code per shop (optionally per table/location), pointing to
 * /shop/{shopId}?location=... on the storefront, per the proposal's ZXing choice.
 */
@Service
@RequiredArgsConstructor
public class QrCodeService {

    private static final int QR_SIZE_PX = 400;

    private final QrCodeRepository qrCodeRepository;
    private final ShopService shopService;

    @Value("${app.storefront-base-url:https://app.foodplatform.example/shop}")
    private String storefrontBaseUrl;

    @Transactional
    public QrCodeResponse generateQrCode(UUID shopId, String location) {
        Shop shop = shopService.findShopOrThrow(shopId);

        String targetUrl = storefrontBaseUrl + "/" + shopId
                + (location != null && !location.isBlank() ? "?location=" + urlEncode(location) : "");

        QrCode qrCode = QrCode.builder()
                .shop(shop)
                .targetUrl(targetUrl)
                .location(location)
                .isActive(true)
                .build();
        qrCode = qrCodeRepository.save(qrCode);

        String base64Image = renderQrPng(targetUrl);
        return QrCodeResponse.from(qrCode, base64Image);
    }

    public List<QrCodeResponse> getQrCodes(UUID shopId) {
        return qrCodeRepository.findByShop_ShopId(shopId).stream()
                .map(q -> QrCodeResponse.from(q, renderQrPng(q.getTargetUrl())))
                .toList();
    }

    @Transactional
    public void deactivate(UUID qrId) {
        QrCode qrCode = qrCodeRepository.findById(qrId)
                .orElseThrow(() -> new ResourceNotFoundException("QR code not found: " + qrId));
        qrCode.setActive(false);
        qrCodeRepository.save(qrCode);
    }

    private String renderQrPng(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, QR_SIZE_PX, QR_SIZE_PX);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (WriterException | IOException e) {
            throw new IllegalStateException("Failed to render QR code image", e);
        }
    }

    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}
