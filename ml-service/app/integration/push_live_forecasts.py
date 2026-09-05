"""
Live equivalent of app/integration/push_forecasts.py.

Resolves the two blockers that file's docstring flagged:
  1. "No machine-to-machine auth path" — resolved. The backend now accepts
     a static service token via Authorization: Bearer <token> on
     POST /api/v1/shops/{shopId}/forecasts specifically (see the
     MlServiceApiKeyFilter added to the backend, restricted to that one
     path+method — every other endpoint's auth is untouched).
  2. "item_mapping.json is empty" — no longer needed for live data, since
     we now read real shop_id/item_id straight out of Postgres
     (app/data/live_sales.py) instead of demo (source, item_name) keys.

Same payload contract as push_forecasts.py:
    POST /api/v1/shops/{shopId}/forecasts
    { "itemId", "forecastDate", "predictedQuantity", "lowerBound",
      "upperBound", "modelName", "modelVersion" }
One POST per (item, day).
"""

from __future__ import annotations

import os

import pandas as pd
import requests

from app.config import BACKEND_BASE_URL, BACKEND_FORECAST_PATH, ML_PUSH_API_KEY_ENV_VAR
from app.data.live_sales import list_shops_with_orders, list_items_for_shop
from app.inference.live_predict import predict_live

MODEL_VERSION = "v1-live"  # bump manually when the training methodology changes meaningfully


def _auth_headers() -> dict:
    """Uses a dedicated X-ML-Service-Key header, deliberately NOT
    Authorization: Bearer — that header is reserved for real user JWTs on
    the backend (JwtAuthenticationFilter), and reusing it here risks that
    filter tripping over a non-JWT value and clearing the auth context this
    request needs. Keeping the two completely separate means this can run
    without touching any existing auth behavior at all."""
    key = os.environ.get(ML_PUSH_API_KEY_ENV_VAR)
    if not key:
        raise RuntimeError(
            f"Environment variable {ML_PUSH_API_KEY_ENV_VAR} is not set. "
            "This must match ML_PUSH_API_KEY configured on the backend "
            "(see backend .env.example)."
        )
    return {"X-ML-Service-Key": key}


def _row_to_payload(row: pd.Series, item_id: str) -> dict:
    forecast_date = row["date"]
    if isinstance(forecast_date, pd.Timestamp):
        forecast_date = forecast_date.date()

    return {
        "itemId": item_id,
        "forecastDate": forecast_date.isoformat(),
        "predictedQuantity": round(float(row["predicted_demand"]), 2),
        "lowerBound": round(float(row["lower_bound"]), 2),
        "upperBound": round(float(row["upper_bound"]), 2),
        "modelName": row["method"],
        "modelVersion": MODEL_VERSION,
    }


def push_item_forecast(shop_id: str, item_id: str, n_days: int = 7,
                        dry_run: bool = False) -> list[dict]:
    forecast_df = predict_live(shop_id, item_id, n_days)
    url = f"{BACKEND_BASE_URL}{BACKEND_FORECAST_PATH.format(shop_id=shop_id)}"

    sent = []
    for _, row in forecast_df.iterrows():
        payload = _row_to_payload(row, item_id)
        sent.append(payload)

        if dry_run:
            print(f"[dry run] would POST {url}\n  {payload}")
            continue

        response = requests.post(url, json=payload, headers=_auth_headers(), timeout=10)
        if response.status_code >= 400:
            print(f"FAILED shop={shop_id} item={item_id} {payload['forecastDate']}: "
                  f"{response.status_code} {response.text}")
        else:
            print(f"pushed shop={shop_id} item={item_id} {payload['forecastDate']} "
                  f"-> {payload['predictedQuantity']} ({payload['modelName']})")

    return sent


def push_all_shops(n_days: int = 7, dry_run: bool = False, min_history_days: int = 1):
    """Nightly job entry point. For every shop with at least
    `min_history_days` of order history, forecasts every menu item
    (including brand-new ones with zero sales — they'll get a popularity
    estimate) and pushes the results."""
    shop_ids = list_shops_with_orders(min_days=min_history_days)
    print(f"{len(shop_ids)} shop(s) with order history found")

    results = {}
    for shop_id in shop_ids:
        items = list_items_for_shop(shop_id)
        print(f"shop {shop_id}: {len(items)} menu item(s)")
        for _, item in items.iterrows():
            key = (shop_id, item["item_id"])
            try:
                results[key] = push_item_forecast(shop_id, item["item_id"], n_days, dry_run)
            except Exception as e:
                print(f"ERROR shop={shop_id} item={item['item_id']} ({item['item_name']}): {e}")
    return results


if __name__ == "__main__":
    # dry_run=True by default on purpose — flip to False once you've
    # verified the printed payloads look right against your real data.
    push_all_shops(n_days=7, dry_run=True)
