package com.foodplatform.backend.controller;

import com.foodplatform.backend.dto.request.TableRequest;
import com.foodplatform.backend.dto.response.TableResponse;
import com.foodplatform.backend.security.AppUserDetails;
import com.foodplatform.backend.service.TableService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tables")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
@Tag(name = "Tables", description = "Physical dine-in table management for the owner dashboard")
public class TableController {

    private final TableService tableService;

    @GetMapping
    public ResponseEntity<List<TableResponse>> list(@AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(tableService.getTablesForOwner(principal.getUserId()));
    }

    @PostMapping
    public ResponseEntity<TableResponse> create(@AuthenticationPrincipal AppUserDetails principal,
                                                 @Valid @RequestBody TableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.createTable(principal.getUserId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        tableService.deleteTable(id);
        return ResponseEntity.noContent().build();
    }
}
