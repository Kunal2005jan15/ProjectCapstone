-- ============================================================================
-- V3__frontend_alignment.sql
-- Adds columns needed to serve the QROder React frontend directly:
--   - shops.slug          -> public storefront route (/store/{slug})
--   - shops.service_type  -> DINE_IN vs COUNTER_ONLY (set at registration)
--   - shops.template_id   -> chosen storefront layout (see frontend TEMPLATES)
--   - shop_themes.theme_data -> free-form JSON for the storefront customization UI
-- ============================================================================

ALTER TABLE shops ADD COLUMN slug VARCHAR(180);
ALTER TABLE shops ADD COLUMN service_type VARCHAR(20) NOT NULL DEFAULT 'DINE_IN'
    CHECK (service_type IN ('DINE_IN','COUNTER_ONLY'));
ALTER TABLE shops ADD COLUMN template_id VARCHAR(40) NOT NULL DEFAULT 'classic';

-- Backfill any pre-existing rows with a deterministic slug before enforcing NOT NULL/UNIQUE.
UPDATE shops SET slug = 'shop-' || substr(shop_id::text, 1, 8) WHERE slug IS NULL;

ALTER TABLE shops ALTER COLUMN slug SET NOT NULL;
ALTER TABLE shops ADD CONSTRAINT uq_shops_slug UNIQUE (slug);

ALTER TABLE shop_themes ADD COLUMN theme_data TEXT;
