package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.response.QrCodeResponse;
import com.foodplatform.backend.service.QrCodeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shops/{shopId}/qr-codes")
@RequiredArgsConstructor
@Tag(name = "QR Codes", description = "Auto-generated, downloadable/printable QR codes per shop/table")
public class QrCodeController {

    private final QrCodeService qrCodeService;

    @PostMapping
    public ResponseEntity<QrCodeResponse> generate(@PathVariable UUID shopId,
                                                    @RequestParam(required = false) String location) {
        return ResponseEntity.status(HttpStatus.CREATED).body(qrCodeService.generateQrCode(shopId, location));
    }

    @GetMapping
    public ResponseEntity<List<QrCodeResponse>> list(@PathVariable UUID shopId) {
        return ResponseEntity.ok(qrCodeService.getQrCodes(shopId));
    }

    @PatchMapping("/{qrId}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable UUID shopId, @PathVariable UUID qrId) {
        qrCodeService.deactivate(qrId);
        return ResponseEntity.noContent().build();
    }
}
