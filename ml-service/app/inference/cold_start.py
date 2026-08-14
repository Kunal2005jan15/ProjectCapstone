"""
Cold-Start Strategy — tiered fallback for shops/items with limited or zero
history. This is the design referenced in the Findings & Results report, §9.

Three tiers, chosen automatically per (source, item) based on how much real
data exists:

  Tier 1 — "prophet"             enough history AND volume -> real model
  Tier 2 — "moving_average"      some history, not enough for Prophet
  Tier 3 — "popularity"          ~no history at all -> fall back to what
                                   sells well across the whole source/category

This module is intentionally decoupled from Prophet/joblib — it only
classifies which tier an item belongs in and computes the popularity
fallback. predict.py already handles Tiers 1-2; this adds Tier 3 and a
single entry point that chooses between all three.
"""

import pandas as pd

from app.config import SALES_DAILY_PROCESSED_CSV
from app.modeling.train_test_split import MIN_HISTORY_DAYS, MIN_AVG_DAILY_QTY, JUNK_ITEM_NAMES

# Below this many days of history, don't even trust a moving average —
# go straight to popularity ranking. A single data point isn't a trend.
MIN_HISTORY_DAYS_FOR_MOVING_AVERAGE = 7


def classify_tier(source: str, item_name: str) -> str:
    """Returns 'prophet', 'moving_average', or 'popularity' for a given item,
    based on the same thresholds validated in Section 5 of the findings.
    """
    if item_name in JUNK_ITEM_NAMES:
        return "popularity"  # never train on non-food entries

    df = pd.read_csv(SALES_DAILY_PROCESSED_CSV, parse_dates=["date"])
    item_df = df[(df["source"] == source) & (df["item_name"] == item_name)]

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


def popularity_forecast(source: str, category: str | None, n_days: int) -> pd.DataFrame:
    """Tier 3 — no personal history at all. Falls back to the average daily
    demand of the best-selling items in the same category (or the whole
    source, if category is unknown), same logic already planned for
    new-customer item recommendations (Project Proposal §8.4) applied here
    to demand forecasting instead of ranking.
    """
    df = pd.read_csv(SALES_DAILY_PROCESSED_CSV, parse_dates=["date"])
    pool = df[df["source"] == source]
    if category:
        scoped = pool[pool["category"] == category]
        pool = scoped if not scoped.empty else pool  # fall back further if category is empty/unknown

    if pool.empty:
        raise ValueError(f"No data at all for source={source} to build a popularity estimate from.")

    # Average daily demand across the pool's best-selling items (top 25% by volume)
    per_item_avg = pool.groupby("item_name")["quantity_sold"].mean()
    top_quartile_cutoff = per_item_avg.quantile(0.75)
    top_items = per_item_avg[per_item_avg >= top_quartile_cutoff]
    estimate = top_items.mean() if not top_items.empty else per_item_avg.mean()

    last_date = pool["date"].max()
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=n_days)

    return pd.DataFrame({
        "date": future_dates,
        "predicted_demand": estimate,
        "lower_bound": 0.0,
        "upper_bound": estimate * 2,  # deliberately wide — this is a rough estimate, say so honestly
        "method": "popularity_fallback",
    })
