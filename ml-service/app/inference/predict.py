"""
STEP 10 — Real-Time Data
STEP 11 — Prediction

Three-tier cold-start strategy (see app/inference/cold_start.py and the
Findings & Results report, §9):
  Tier 1 "prophet"           trained model exists -> use it
  Tier 2 "moving_average"     some history, no trained model -> recent average
  Tier 3 "popularity"          ~no history -> category/source popularity estimate
"""

import pandas as pd

from app.config import SALES_DAILY_PROCESSED_CSV, model_path_for
from app.inference.load_model import load_model
from app.inference.cold_start import classify_tier, popularity_forecast

MOVING_AVERAGE_WINDOW_DAYS = 14


def _moving_average_forecast(source: str, item_name: str, n_days: int) -> pd.DataFrame:
    df = pd.read_csv(SALES_DAILY_PROCESSED_CSV, parse_dates=["date"])
    item_df = df[(df["source"] == source) & (df["item_name"] == item_name)]

    if item_df.empty:
        raise ValueError(f"No sales history at all for {source}/{item_name} — "
                          f"nothing to average, not even a fallback estimate.")

    recent = item_df.sort_values("date").tail(MOVING_AVERAGE_WINDOW_DAYS)
    avg_demand = recent["quantity_sold"].mean()
    std_demand = recent["quantity_sold"].std() or 0.0

    last_date = item_df["date"].max()
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=n_days)

    return pd.DataFrame({
        "date": future_dates,
        "predicted_demand": avg_demand,
        "lower_bound": max(0, avg_demand - std_demand),
        "upper_bound": avg_demand + std_demand,
        "method": "moving_average_fallback",
    })


def _get_category(source: str, item_name: str):
    df = pd.read_csv(SALES_DAILY_PROCESSED_CSV, parse_dates=["date"])
    item_df = df[(df["source"] == source) & (df["item_name"] == item_name)]
    if item_df.empty:
        return None
    return item_df["category"].iloc[0]


def predict_next_n_days(source: str, item_name: str, n_days: int = 7) -> pd.DataFrame:
    path = model_path_for(source, item_name)

    if path.exists():
        # Trust the saved model over re-classifying — if it exists, it was
        # eligible at last training time, which is the source of truth.
        model = load_model(source, item_name)
        future = model.make_future_dataframe(periods=n_days)
        forecast = model.predict(future)

        result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(n_days)
        result = result.rename(columns={
            "ds": "date", "yhat": "predicted_demand",
            "yhat_lower": "lower_bound", "yhat_upper": "upper_bound",
        })
        result["method"] = "prophet"
    else:
        tier = classify_tier(source, item_name)
        if tier == "moving_average":
            result = _moving_average_forecast(source, item_name, n_days)
        else:  # "popularity" — includes items with zero history at all
            category = _get_category(source, item_name)
            result = popularity_forecast(source, category, n_days)

    for col in ("predicted_demand", "lower_bound", "upper_bound"):
        result[col] = result[col].clip(lower=0)
    return result.reset_index(drop=True)


if __name__ == "__main__":
    print("Tier 1 (prophet) — Coffee:")
    print(predict_next_n_days(source="bakery", item_name="Coffee", n_days=7))
    print()
    print("Tier 2/3 (fallback) — Eggs:")
    print(predict_next_n_days(source="bakery", item_name="Eggs", n_days=7))
    print()
    print("Tier 3 (popularity) — a made-up brand-new item with zero history:")
    print(popularity_forecast(source="bakery", category="bakery_item", n_days=7))
