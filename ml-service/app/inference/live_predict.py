"""
Live equivalent of app/inference/predict.py + app/inference/cold_start.py,
driven by real order data from Postgres (app/data/live_sales.py) instead of
the demo pizza/bakery CSV.

Deliberately kept as a SEPARATE module rather than editing predict.py /
cold_start.py in place:
  - Zero risk of breaking the existing demo pipeline (still used for the
    capstone report / grading artifacts in models_store/).
  - Real shops are keyed by (shop_id, item_id) UUIDs, not (source,
    item_name) strings — different enough shape that sharing one function
    would need source/item_name vs shop_id/item_id branches everywhere.

Same three-tier cold-start strategy as the demo pipeline:
  Tier 1 "prophet"          enough history + volume -> trained Prophet model
  Tier 2 "moving_average"   some history, not enough for Prophet
  Tier 3 "popularity"       ~no history -> shop-wide popularity estimate
"""

from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from prophet import Prophet

from app.data.live_sales import get_live_sales_daily
from app.modeling.train_test_split import MIN_HISTORY_DAYS, MIN_AVG_DAILY_QTY

# Kept deliberately separate from models_store/ (the demo pizza/bakery
# models) so the two never collide or get mixed up on disk.
LIVE_MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models_store_live"
LIVE_MODELS_DIR.mkdir(parents=True, exist_ok=True)

MIN_HISTORY_DAYS_FOR_MOVING_AVERAGE = 7
MOVING_AVERAGE_WINDOW_DAYS = 14


def _model_path(shop_id: str, item_id: str) -> Path:
    return LIVE_MODELS_DIR / f"prophet__{shop_id}__{item_id}.joblib"


def classify_tier(item_df: pd.DataFrame) -> str:
    """item_df: rows for one (shop, item) only, already filtered."""
    if item_df.empty:
        return "popularity"

    days_of_data = item_df["date"].nunique()
    avg_daily_qty = item_df["quantity_sold"].mean()

    if days_of_data >= MIN_HISTORY_DAYS and avg_daily_qty >= MIN_AVG_DAILY_QTY:
        return "prophet"
    elif days_of_data >= MIN_HISTORY_DAYS_FOR_MOVING_AVERAGE:
        return "moving_average"
    else:
        return "popularity"


def _moving_average_forecast(item_df: pd.DataFrame, n_days: int) -> pd.DataFrame:
    recent = item_df.sort_values("date").tail(MOVING_AVERAGE_WINDOW_DAYS)
    avg_demand = recent["quantity_sold"].mean()
    std_demand = recent["quantity_sold"].std() or 0.0

    last_date = item_df["date"].max()
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=n_days)

    return pd.DataFrame({
        "date": future_dates,
        "predicted_demand": avg_demand,
        "lower_bound": max(0.0, avg_demand - std_demand),
        "upper_bound": avg_demand + std_demand,
        "method": "moving_average_fallback",
    })


def _popularity_forecast(shop_df: pd.DataFrame, category: str | None, n_days: int) -> pd.DataFrame:
    pool = shop_df
    if category:
        scoped = pool[pool["category"] == category]
        pool = scoped if not scoped.empty else pool

    if pool.empty:
        raise ValueError("No sales history at all for this shop yet — "
                          "not even enough for a popularity estimate.")

    per_item_avg = pool.groupby("item_id")["quantity_sold"].mean()
    top_quartile_cutoff = per_item_avg.quantile(0.75)
    top_items = per_item_avg[per_item_avg >= top_quartile_cutoff]
    estimate = top_items.mean() if not top_items.empty else per_item_avg.mean()

    last_date = pool["date"].max()
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=n_days)

    return pd.DataFrame({
        "date": future_dates,
        "predicted_demand": estimate,
        "lower_bound": 0.0,
        "upper_bound": estimate * 2,  # deliberately wide — rough estimate, say so honestly
        "method": "popularity_fallback",
    })


def train_and_save_live_model(shop_id: str, item_id: str, item_df: pd.DataFrame) -> Prophet:
    # Yearly seasonality needs ~2 years of history to estimate reliably
    # (Prophet warns and can produce an unstable trend otherwise) — every
    # real shop starts with zero history, so enable it only once there's
    # enough to trust it. Weekly seasonality is safe from day one.
    days_of_history = item_df["date"].nunique()
    use_yearly = days_of_history >= 400

    model = Prophet(weekly_seasonality=True, yearly_seasonality=use_yearly, daily_seasonality=False)
    prophet_df = item_df.sort_values("date").rename(columns={"date": "ds", "quantity_sold": "y"})[["ds", "y"]]
    model.fit(prophet_df)
    joblib.dump(model, _model_path(shop_id, item_id))
    return model


def predict_live(shop_id: str, item_id: str, n_days: int = 7,
                  retrain_if_stale: bool = True) -> pd.DataFrame:
    """Forecasts the next n_days for one real (shop_id, item_id).

    retrain_if_stale=True (default): if no saved model exists yet but the
    item now qualifies for Tier 1, trains one on the spot (a few seconds for
    a single item) and caches it, instead of only ever using whatever the
    last nightly job produced. Set False if you want prediction to be
    read-only and leave training strictly to the nightly job
    (app/modeling/train_live_models.py).
    """
    shop_df = get_live_sales_daily(shop_id)
    item_df = shop_df[shop_df["item_id"] == item_id] if not shop_df.empty else shop_df

    model_path = _model_path(shop_id, item_id)
    tier = classify_tier(item_df)

    if tier == "prophet":
        if model_path.exists():
            model = joblib.load(model_path)
        elif retrain_if_stale:
            model = train_and_save_live_model(shop_id, item_id, item_df)
        else:
            # Qualifies for Tier 1 but the nightly job hasn't trained it
            # yet — fall back gracefully instead of erroring.
            result = _moving_average_forecast(item_df, n_days)
            return _clip(result)

        future = model.make_future_dataframe(periods=n_days)
        forecast = model.predict(future)
        result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(n_days)
        result = result.rename(columns={
            "ds": "date", "yhat": "predicted_demand",
            "yhat_lower": "lower_bound", "yhat_upper": "upper_bound",
        })
        result["method"] = "prophet"

    elif tier == "moving_average":
        result = _moving_average_forecast(item_df, n_days)

    else:  # "popularity" — includes brand-new items with zero history
        category = item_df["category"].iloc[0] if not item_df.empty else None
        result = _popularity_forecast(shop_df, category, n_days)

    return _clip(result)


def _clip(result: pd.DataFrame) -> pd.DataFrame:
    for col in ("predicted_demand", "lower_bound", "upper_bound"):
        result[col] = result[col].clip(lower=0)
    return result.reset_index(drop=True)
