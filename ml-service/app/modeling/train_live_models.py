"""
Nightly training job for the live pipeline — the real-data equivalent of
app/modeling/train_model.py.

For every shop with order history, for every menu item that now qualifies
for Tier 1 (see live_predict.classify_tier), trains a fresh Prophet model
on the latest data and saves it to models_store_live/. Items that don't
qualify yet are simply skipped here — predict_live() handles them live via
the moving-average / popularity fallback tiers, so nothing breaks; they
just don't get a cached model until they have enough history.

Intended to run on a schedule (cron / Render Cron Job / GitHub Actions —
whatever the deployment uses), separately from request-serving traffic, so
that /forecast/live stays fast (reads a pre-trained model instead of
training inline).

Run directly: python -m app.modeling.train_live_models
"""

from __future__ import annotations

from app.data.live_sales import list_shops_with_orders, list_items_for_shop, get_live_sales_daily
from app.inference.live_predict import classify_tier, train_and_save_live_model


def train_all_live_models(min_history_days: int = 1) -> dict:
    shop_ids = list_shops_with_orders(min_days=min_history_days)
    print(f"{len(shop_ids)} shop(s) with order history")

    trained = {}
    for shop_id in shop_ids:
        shop_df = get_live_sales_daily(shop_id)
        items = list_items_for_shop(shop_id)

        for _, item in items.iterrows():
            item_id = item["item_id"]
            item_df = shop_df[shop_df["item_id"] == item_id]
            tier = classify_tier(item_df)

            if tier != "prophet":
                continue  # left to the moving_average/popularity fallback at request time

            print(f"training shop={shop_id} item={item_id} ({item['item_name']}) "
                  f"on {item_df['date'].nunique()} days of history...")
            try:
                train_and_save_live_model(shop_id, item_id, item_df)
                trained[(shop_id, item_id)] = "ok"
            except Exception as e:
                print(f"  FAILED: {e}")
                trained[(shop_id, item_id)] = f"error: {e}"

    print(f"trained {sum(1 for v in trained.values() if v == 'ok')} model(s), "
          f"{sum(1 for v in trained.values() if v != 'ok')} failure(s)")
    return trained


if __name__ == "__main__":
    train_all_live_models()
