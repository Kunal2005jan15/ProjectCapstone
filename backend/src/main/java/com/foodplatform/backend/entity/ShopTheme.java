package com.foodplatform.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "shop_themes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopTheme {

    @Id
    @GeneratedValue
    @Column(name = "theme_id", updatable = false, nullable = false)
    private UUID themeId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, unique = true)
    private Shop shop;

    @Column(name = "theme_name", length = 80)
    private String themeName;

    @Column(name = "primary_color", length = 20)
    private String primaryColor;

    @Column(name = "secondary_color", length = 20)
    private String secondaryColor;

    @Column(name = "font_family", length = 80)
    private String fontFamily;

    @Column(name = "show_about", nullable = false)
    @Builder.Default
    private boolean showAbout = true;

    @Column(name = "show_gallery", nullable = false)
    @Builder.Default
    private boolean showGallery = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "layout_config", columnDefinition = "jsonb")
    private String layoutConfig;

    /**
     * Raw JSON (serialized by the service layer) holding the frontend's free-form
     * theme object: primaryColor, font, logoUrl, bannerUrl, tagline, contactPhone,
     * contactAddress, instagramUrl, facebookUrl, whatsapp, footerNote, etc.
     * Kept schema-less so the storefront customization UI can evolve without migrations.
     */
    @Column(name = "theme_data", columnDefinition = "TEXT")
    private String themeData;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
