package com.foodplatform.backend.entity;

import com.foodplatform.backend.entity.enums.ServiceType;
import com.foodplatform.backend.entity.enums.ShopStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @GeneratedValue
    @Column(name = "shop_id", updatable = false, nullable = false)
    private UUID shopId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "shop_name", nullable = false, length = 150)
    private String shopName;

    /** URL-safe identifier used for the public storefront route (/store/{slug}). */
    @Column(name = "slug", nullable = false, unique = true, length = 180)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 20)
    @Builder.Default
    private ServiceType serviceType = ServiceType.DINE_IN;

    /** Which storefront layout (see frontend TEMPLATES) the owner has chosen. */
    @Column(name = "template_id", nullable = false, length = 40)
    @Builder.Default
    private String templateId = "classic";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    private String phone;

    @Column(length = 180)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Column(name = "cuisine_type", length = 80)
    private String cuisineType;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ShopStatus status = ShopStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
