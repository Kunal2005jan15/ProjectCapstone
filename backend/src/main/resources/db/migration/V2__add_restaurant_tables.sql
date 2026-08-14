-- ----------------------------------------------------------------------------
-- RESTAURANT_TABLE
-- Physical dine-in tables for a shop (distinct from QR_CODE, which is a
-- generated scannable link that may or may not point at a table).
-- ----------------------------------------------------------------------------
CREATE TABLE restaurant_tables (
    table_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id         UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    table_number    INTEGER NOT NULL,
    seats           INTEGER NOT NULL DEFAULT 2,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (shop_id, table_number)
);
CREATE INDEX idx_restaurant_tables_shop_id ON restaurant_tables(shop_id);
