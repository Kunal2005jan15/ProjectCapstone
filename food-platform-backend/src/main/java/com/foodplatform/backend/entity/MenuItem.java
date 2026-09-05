package com.foodplatform.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue
    @Column(name = "item_id", updatable = false, nullable = false)
    private UUID itemId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "cost_price", precision = 10, scale = 2)
    private BigDecimal costPrice;

    // TEXT, not a short varchar: uploaded photos are stored as base64 data
    // URIs (see MenuManagement.jsx's file-upload handler), which are far
    // longer than a typical URL and would get silently rejected/truncated
    // at length = 500.
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "is_vegetarian", nullable = false)
    @Builder.Default
    private boolean isVegetarian = true;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private boolean isAvailable = true;

    @Column(name = "preparation_time")
    private Integer preparationTime;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
