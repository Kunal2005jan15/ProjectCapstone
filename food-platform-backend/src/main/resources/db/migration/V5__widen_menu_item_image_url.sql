-- ----------------------------------------------------------------------------
-- Dish photos uploaded from MenuManagement.jsx are stored as base64 data URIs
-- (not plain URLs), which are far longer than the original 500-char cap and
-- were being rejected/truncated. Widen to TEXT to match the MenuItem entity.
-- ----------------------------------------------------------------------------
ALTER TABLE menu_items ALTER COLUMN image_url TYPE TEXT;
