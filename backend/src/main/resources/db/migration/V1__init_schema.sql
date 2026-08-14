-- ============================================================================
-- V1__init_schema.sql
-- Food Business Digital Platform - Initial schema
-- Mirrors the ER diagram: USER, SHOP, SHOP_THEME, CATEGORY, MENU_ITEM,
-- CUSTOMER, CUSTOMER_SESSION, QR_CODE, ORDER, ORDER_ITEM, INVENTORY,
-- INVENTORY_TRANSACTION, FORECAST, RECOMMENDATION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- USER
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(180) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('OWNER','CUSTOMER','ADMIN')),
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- SHOP
-- ----------------------------------------------------------------------------
CREATE TABLE shops (
    shop_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    shop_name       VARCHAR(150) NOT NULL,
    description     TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(180),
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(10),
    cuisine_type    VARCHAR(80),
    logo_url        VARCHAR(500),
    banner_url      VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_shops_owner_id ON shops(owner_id);

-- ----------------------------------------------------------------------------
-- SHOP_THEME  (1:1 with SHOP)
-- ----------------------------------------------------------------------------
CREATE TABLE shop_themes (
    theme_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id         UUID NOT NULL UNIQUE REFERENCES shops(shop_id) ON DELETE CASCADE,
    theme_name      VARCHAR(80),
    primary_color   VARCHAR(20),
    secondary_color VARCHAR(20),
    font_family     VARCHAR(80),
    show_about      BOOLEAN NOT NULL DEFAULT TRUE,
    show_gallery    BOOLEAN NOT NULL DEFAULT TRUE,
    layout_config   JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- CATEGORY
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    category_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id         UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    category_name   VARCHAR(100) NOT NULL,
    description     TEXT,
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_categories_shop_id ON categories(shop_id);

-- ----------------------------------------------------------------------------
-- MENU_ITEM
-- ----------------------------------------------------------------------------
CREATE TABLE menu_items (
    item_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id             UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    category_id         UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    item_name           VARCHAR(150) NOT NULL,
    description         TEXT,
    price               NUMERIC(10,2) NOT NULL,
    cost_price          NUMERIC(10,2),
    image_url           VARCHAR(500),
    is_vegetarian       BOOLEAN NOT NULL DEFAULT TRUE,
    is_available        BOOLEAN NOT NULL DEFAULT TRUE,
    preparation_time    INTEGER,
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_menu_items_shop_id ON menu_items(shop_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);

-- ----------------------------------------------------------------------------
-- CUSTOMER
-- ----------------------------------------------------------------------------
CREATE TABLE customers (
    customer_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150),
    phone           VARCHAR(20),
    email           VARCHAR(180),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- CUSTOMER_SESSION  (supports no-login ordering)
-- ----------------------------------------------------------------------------
CREATE TABLE customer_sessions (
    session_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id         UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    started_at      TIMESTAMP NOT NULL DEFAULT now(),
    last_active_at  TIMESTAMP NOT NULL DEFAULT now(),
    device_type     VARCHAR(40)
);
CREATE INDEX idx_sessions_shop_id ON customer_sessions(shop_id);
CREATE INDEX idx_sessions_customer_id ON customer_sessions(customer_id);

-- ----------------------------------------------------------------------------
-- QR_CODE
-- ----------------------------------------------------------------------------
CREATE TABLE qr_codes (
    qr_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id         UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    qr_code_url     VARCHAR(500),
    target_url      VARCHAR(500) NOT NULL,
    location        VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_qr_codes_shop_id ON qr_codes(shop_id);

-- ----------------------------------------------------------------------------
-- ORDER
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
    order_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id             UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    customer_id         UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    session_id          UUID REFERENCES customer_sessions(session_id) ON DELETE SET NULL,
    order_timestamp     TIMESTAMP NOT NULL DEFAULT now(),
    order_status        VARCHAR(20) NOT NULL DEFAULT 'RECEIVED'
                         CHECK (order_status IN ('RECEIVED','PREPARING','READY','COMPLETED','CANCELLED')),
    order_type          VARCHAR(20) NOT NULL DEFAULT 'DINE_IN'
                         CHECK (order_type IN ('DINE_IN','TAKEAWAY')),
    table_number        VARCHAR(20),
    subtotal            NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax                 NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount            NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                         CHECK (payment_status IN ('PENDING','PAID','FAILED','REFUNDED')),
    payment_method      VARCHAR(20) CHECK (payment_method IN ('CASH','UPI','CARD','WALLET')),
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_shop_id ON orders(shop_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_timestamp ON orders(order_timestamp);
CREATE INDEX idx_orders_shop_timestamp ON orders(shop_id, order_timestamp);

-- ----------------------------------------------------------------------------
-- ORDER_ITEM
-- ----------------------------------------------------------------------------
CREATE TABLE order_items (
    order_item_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    item_id         UUID NOT NULL REFERENCES menu_items(item_id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(10,2) NOT NULL,
    discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_price     NUMERIC(10,2) NOT NULL
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);

-- ----------------------------------------------------------------------------
-- INVENTORY  (1:1 with MENU_ITEM)
-- ----------------------------------------------------------------------------
CREATE TABLE inventory (
    inventory_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id         UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    item_id         UUID NOT NULL UNIQUE REFERENCES menu_items(item_id) ON DELETE CASCADE,
    current_stock   NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit            VARCHAR(20),
    reorder_level   NUMERIC(12,2) NOT NULL DEFAULT 0,
    safety_stock    NUMERIC(12,2) NOT NULL DEFAULT 0,
    last_updated    TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_inventory_shop_id ON inventory(shop_id);

-- ----------------------------------------------------------------------------
-- INVENTORY_TRANSACTION
-- ----------------------------------------------------------------------------
CREATE TABLE inventory_transactions (
    transaction_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id        UUID NOT NULL REFERENCES inventory(inventory_id) ON DELETE CASCADE,
    transaction_type     VARCHAR(20) NOT NULL
                         CHECK (transaction_type IN ('PURCHASE','SALE','WASTAGE','ADJUSTMENT','RESTOCK')),
    quantity            NUMERIC(12,2) NOT NULL,
    transaction_time     TIMESTAMP NOT NULL DEFAULT now(),
    reason              VARCHAR(255)
);
CREATE INDEX idx_inv_txn_inventory_id ON inventory_transactions(inventory_id);

-- ----------------------------------------------------------------------------
-- FORECAST
-- ----------------------------------------------------------------------------
CREATE TABLE forecasts (
    forecast_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id             UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    item_id             UUID NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
    forecast_date       DATE NOT NULL,
    predicted_quantity  NUMERIC(12,2) NOT NULL,
    lower_bound         NUMERIC(12,2),
    upper_bound         NUMERIC(12,2),
    model_name          VARCHAR(80),
    model_version       VARCHAR(40),
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (shop_id, item_id, forecast_date, model_name)
);
CREATE INDEX idx_forecasts_shop_item_date ON forecasts(shop_id, item_id, forecast_date);

-- ----------------------------------------------------------------------------
-- RECOMMENDATION
-- ----------------------------------------------------------------------------
CREATE TABLE recommendations (
    recommendation_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id                 UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    customer_id             UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    session_id              UUID REFERENCES customer_sessions(session_id) ON DELETE SET NULL,
    item_id                 UUID NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
    recommendation_type     VARCHAR(20) NOT NULL
                            CHECK (recommendation_type IN ('REORDER_USUAL','POPULAR_ITEM','ALSO_BOUGHT','TRENDING')),
    score                   NUMERIC(6,4),
    reason                  VARCHAR(255),
    created_at              TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_recommendations_shop_id ON recommendations(shop_id);
CREATE INDEX idx_recommendations_session_id ON recommendations(session_id);
