"""
Reads REAL sales history straight out of the Dine-Shop-AI Postgres database
(orders / order_items / menu_items / categories) and shapes it into the same
kind of daily-sales dataframe the demo CSV pipeline uses — so the existing
cold-start / Prophet logic can be reused with minimal duplication.

Columns produced (matches the shape of sales_daily.csv, but keyed by real
UUIDs instead of demo item_name strings):

    date            (datetime64, day granularity)
    shop_id         (str UUID)
    item_id         (str UUID)
    item_name       (str — for display/logging only, not used as a key)
    category        (str, may be None)
    quantity_sold   (float)

CANCELLED orders are excluded (they never happened, from a demand
standpoint). All other statuses (RECEIVED/PREPARING/READY/COMPLETED) count,
since order placement — not fulfillment — is when demand was expressed.
"""

from __future__ import annotations

import pandas as pd
from sqlalchemy import text

from app.data.db import get_engine

_QUERY = """
    SELECT
        date_trunc('day', o.order_timestamp)::date AS date,
        o.shop_id::text                             AS shop_id,
        oi.item_id::text                            AS item_id,
        mi.item_name                                AS item_name,
        c.category_name                             AS category,
        SUM(oi.quantity)                            AS quantity_sold
    FROM order_items oi
    JOIN orders o       ON o.order_id = oi.order_id
    JOIN menu_items mi  ON mi.item_id = oi.item_id
    LEFT JOIN categories c ON c.category_id = mi.category_id
    WHERE o.order_status <> 'CANCELLED'
      AND (:shop_id IS NULL OR o.shop_id = CAST(:shop_id AS uuid))
    GROUP BY date, o.shop_id, oi.item_id, mi.item_name, c.category_name
    ORDER BY date
"""


def get_live_sales_daily(shop_id: str | None = None) -> pd.DataFrame:
    """Daily quantity sold per (shop, item), from real order history.

    Pass shop_id to scope to one shop (recommended — this is what the
    live endpoints/training job use). Omitting it pulls every shop, which
    is mainly useful for the nightly all-shops training job.
    """
    with get_engine().connect() as conn:
        df = pd.read_sql(text(_QUERY), conn, params={"shop_id": shop_id})

    if not df.empty:
        df["date"] = pd.to_datetime(df["date"])
        df["quantity_sold"] = df["quantity_sold"].astype(float)

    return df


def list_shops_with_orders(min_days: int = 1) -> list[str]:
    """Returns shop_ids that have at least `min_days` distinct days of order
    history — used by the nightly job to know which shops are worth
    attempting to train/forecast for at all."""
    query = text("""
        SELECT o.shop_id::text AS shop_id, COUNT(DISTINCT o.order_timestamp::date) AS days
        FROM orders o
        WHERE o.order_status <> 'CANCELLED'
        GROUP BY o.shop_id
        HAVING COUNT(DISTINCT o.order_timestamp::date) >= :min_days
    """)
    with get_engine().connect() as conn:
        df = pd.read_sql(query, conn, params={"min_days": min_days})
    return df["shop_id"].tolist()


def list_items_for_shop(shop_id: str) -> pd.DataFrame:
    """All menu items for a shop (id + name + category) — used to know what
    to loop over for training/forecasting, including items with zero sales
    yet (so they correctly fall into the popularity tier instead of being
    silently skipped)."""
    query = text("""
        SELECT
            mi.item_id::text        AS item_id,
            mi.item_name            AS item_name,
            c.category_name         AS category
        FROM menu_items mi
        LEFT JOIN categories c ON c.category_id = mi.category_id
        WHERE mi.shop_id = CAST(:shop_id AS uuid)
    """)
    with get_engine().connect() as conn:
        return pd.read_sql(query, conn, params={"shop_id": shop_id})
