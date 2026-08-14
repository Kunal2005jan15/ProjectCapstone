"""
Pushes computed forecasts INTO the backend, matching its ForecastController
contract exactly:

    POST /api/v1/shops/{shopId}/forecasts
    { "itemId": UUID, "forecastDate": "YYYY-MM-DD", "predictedQuantity": number,
      "lowerBound": number, "upperBound": number, "modelName": string,
      "modelVersion": string }

One POST per (item, day) — their endpoint takes a single date per call, not
a batch, so an n_days=7 forecast becomes 7 separate requests.

AUTH — UNRESOLVED, read before running this against a real backend:
/api/v1/shops/** currently requires an OWNER or ADMIN JWT. There is no
machine-to-machine auth path yet — this needs to be decided WITH the
backend lead before this can run against anything but a local test
instance. See the Backend Integration Guide v3, Section 3.
"""

import os

import pandas as pd
import requests

from app.config import BACKEND_BASE_URL, BACKEND_FORECAST_PATH, BACKEND_AUTH_TOKEN_ENV_VAR
from app.inference.predict import predict_next_n_days
from app.integration.item_mapping import load_item_mapping, get_backend_ids

MODEL_VERSION = "v1"  # bump manually when the training methodology changes meaningfully


def _auth_headers() -> dict:
    token = os.environ.get(BACKEND_AUTH_TOKEN_ENV_VAR)
    if not token:
        raise RuntimeError(
            f"Environment variable {BACKEND_AUTH_TOKEN_ENV_VAR} is not set. "
            "This push cannot authenticate against the backend until the "
            "auth mechanism is agreed with the backend lead — see this "
            "module's docstring."
        )
    return {"Authorization": f"Bearer {token}"}


def _forecast_row_to_payload(row: pd.Series) -> dict:
    forecast_date = row["date"]
    if isinstance(forecast_date, pd.Timestamp):
        forecast_date = forecast_date.date()

    return {
        "itemId": None,  # filled in by caller, kept here for shape clarity
        "forecastDate": forecast_date.isoformat(),
        "predictedQuantity": round(float(row["predicted_demand"]), 2),
        "lowerBound": round(float(row["lower_bound"]), 2),
        "upperBound": round(float(row["upper_bound"]), 2),
        "modelName": row["method"],
        "modelVersion": MODEL_VERSION,
    }


def push_item_forecast(source: str, item_name: str, n_days: int = 7,
                        mapping: dict | None = None, dry_run: bool = False) -> list[dict]:
    """Computes a forecast for one item and pushes each day to the backend.
    Returns the list of payloads sent (or that WOULD be sent, if dry_run).
    """
    ids = get_backend_ids(source, item_name, mapping)
    if ids is None:
        raise ValueError(
            f"No backend mapping for {source}/{item_name} — this item hasn't "
            "been mapped to a real shop_id/item_id yet. See item_mapping.py."
        )
    shop_id, item_id = ids

    forecast_df = predict_next_n_days(source, item_name, n_days)
    url = f"{BACKEND_BASE_URL}{BACKEND_FORECAST_PATH.format(shop_id=shop_id)}"

    sent_payloads = []
    for _, row in forecast_df.iterrows():
        payload = _forecast_row_to_payload(row)
        payload["itemId"] = item_id
        sent_payloads.append(payload)

        if dry_run:
            print(f"[dry run] would POST {url}\n  {payload}")
            continue

        response = requests.post(url, json=payload, headers=_auth_headers(), timeout=10)
        if response.status_code >= 400:
            print(f"FAILED {source}/{item_name} {payload['forecastDate']}: "
                  f"{response.status_code} {response.text}")
        else:
            print(f"pushed {source}/{item_name} {payload['forecastDate']} "
                  f"-> predicted {payload['predictedQuantity']} ({payload['modelName']})")

    return sent_payloads


def push_all_mapped_items(n_days: int = 7, dry_run: bool = False):
    """Entry point for the nightly job — pushes forecasts for every item
    currently present in item_mapping.json."""
    mapping = load_item_mapping()
    results = {}
    for (source, item_name) in mapping:
        try:
            results[(source, item_name)] = push_item_forecast(
                source, item_name, n_days, mapping=mapping, dry_run=dry_run
            )
        except Exception as e:
            print(f"ERROR pushing {source}/{item_name}: {e}")
    return results


if __name__ == "__main__":
    # dry_run=True by default here on purpose — see module docstring.
    push_all_mapped_items(n_days=7, dry_run=True)