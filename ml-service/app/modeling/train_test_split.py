"""
STEP 5 — Train/Test Split

Reads the processed output of the EDA notebook (app/data/processed/sales_daily.csv)
and builds Prophet's required ds/y format per item, with a time-based
(not random) split — the last N days become the test window.

Run directly: python -m app.modeling.train_test_split
"""

import pandas as pd
from app.config import SALES_DAILY_PROCESSED_CSV

MIN_HISTORY_DAYS = 60      # items with less history than this are skipped for v1
TEST_WINDOW_DAYS = 14      # last 14 days held out for evaluation

# Not real menu items — scraped into the bakery sales log but not food:
# "Adjustment" is an accounting correction, "Tshirt"/"Gift voucher" are
# merchandise, not something to forecast demand for.
JUNK_ITEM_NAMES = {"Adjustment", "Tshirt", "Gift voucher"}


def load_processed() -> pd.DataFrame:
    df = pd.read_csv(SALES_DAILY_PROCESSED_CSV, parse_dates=["date"])
    return df


def to_prophet_frame(item_df: pd.DataFrame) -> pd.DataFrame:
    """Prophet requires exactly two columns: ds (date) and y (target)."""
    return item_df.rename(columns={"date": "ds", "quantity_sold": "y"})[["ds", "y"]]


def split_train_test(item_df: pd.DataFrame, test_window_days: int = TEST_WINDOW_DAYS):
    item_df = item_df.sort_values("date")
    cutoff = item_df["date"].max() - pd.Timedelta(days=test_window_days)
    train = item_df[item_df["date"] <= cutoff]
    test = item_df[item_df["date"] > cutoff]
    return train, test


MIN_HISTORY_DAYS = 60
MIN_AVG_DAILY_QTY = 0.5   # below this, treat as intermittent demand, not a stable series

JUNK_ITEM_NAMES = {"Adjustment", "Tshirt", "Gift voucher"}


def eligible_items(df: pd.DataFrame) -> list[tuple[str, str]]:
    """Two gates, not one: enough days of history AND enough average daily
    volume. A 700-day item selling once a month passes the history check
    but is still too sparse for Prophet to find a real signal in — that's
    exactly what Eggs/Crepes/Ella's Kitchen Pouches showed in evaluation."""
    df = df[~df["item_name"].isin(JUNK_ITEM_NAMES)]
    stats = df.groupby(["source", "item_name"]).agg(
        days_of_data=("date", "nunique"),
        avg_daily_qty=("quantity_sold", "mean"),
    )
    eligible = stats[
        (stats["days_of_data"] >= MIN_HISTORY_DAYS)
        & (stats["avg_daily_qty"] >= MIN_AVG_DAILY_QTY)
    ]
    return list(eligible.index)


if __name__ == "__main__":
    df = load_processed()
    items = eligible_items(df)
    print(f"{len(items)} items eligible for per-item forecasting "
          f"(>= {MIN_HISTORY_DAYS} days of history, junk names excluded)")

    by_source = {}
    for source, item in items:
        by_source.setdefault(source, 0)
        by_source[source] += 1
    print("by source:", by_source)

    for source, item in items[:5]:
        item_df = df[(df["source"] == source) & (df["item_name"] == item)]
        train, test = split_train_test(item_df)
        print(f"  {source}/{item}: train={len(train)} rows, test={len(test)} rows")