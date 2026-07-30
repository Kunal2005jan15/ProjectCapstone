"""
Single source of truth for column roles in app/data/processed/model_features.csv.

Why this file exists
---------------------
During EDA we found that total_orders, total_items, and average_order_value
correlate almost perfectly with total_sales (0.93-0.996). That's expected --
they are outcome variables computed the same day as the sale, not information
we'd actually have in advance when forecasting a future day's sales. If the
model training step accidentally includes them as input features, the model
will score unrealistically well offline and then fail in production, because
those values won't exist yet for the day being predicted.

Model training should import TARGET_COLUMN and MODEL_FEATURE_COLUMNS (or call
get_model_feature_columns) from here instead of hand-picking columns, so this
mistake can't happen silently again.
"""

from __future__ import annotations

import pandas as pd

# The value we are actually trying to predict.
TARGET_COLUMN = "total_sales"

# Columns that must NEVER be used as model inputs because they are only
# known *after* the sales for that day have already happened (target leakage).
LEAKAGE_COLUMNS = [
    "total_orders",
    "total_items",
    "average_order_value",
]

# Non-numeric / identifier columns that are useful for grouping or plotting
# but should not be fed directly into most model families without encoding.
NON_FEATURE_COLUMNS = [
    "date",
    "holiday_name",
    "season",   # string ("Winter"/"Summer"/etc.) -- one-hot/encode before use
    "data_missing",  # diagnostic flag from aggregate_sales.py: True = this
                      # day had no rows in the raw source data and total_sales
                      # was calendar-filled with 0, NOT a confirmed zero-sales
                      # day. Excluded by default -- see note below.
]

# `data_missing` is not excluded because it's leakage -- it's excluded
# because it's diagnostic, not a genuine predictive signal. Model training
# should look at rows where data_missing == True first and decide whether
# to drop them, keep them, or investigate the raw source data, rather than
# training on them as if they were confirmed zero-sales days.

# Everything else in model_features.csv (calendar features, lag features,
# rolling stats, weather flags, holiday-distance features) is safe to use
# as a model input, since it only depends on information available on or
# before the day being predicted.


def get_model_feature_columns(df: pd.DataFrame) -> list[str]:
    """
    Return the list of columns in `df` that are safe to use as model
    features: everything except the target, the leakage columns, and the
    non-numeric identifier columns.
    """
    excluded = set(LEAKAGE_COLUMNS) | set(NON_FEATURE_COLUMNS) | {TARGET_COLUMN}
    return [col for col in df.columns if col not in excluded]