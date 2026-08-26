"""
prophet_model.py
-------------------
This file belongs in app/modeling/.
Job: TRAIN a Prophet model per inventory item and PRODUCE a demand forecast.
It does NOT decide reorder quantities — that decision lives in
app/inference/reorder_engine.py (keeps "how much will be used" separate
from "what should we do about it").

Requires: prophet, pandas, cmdstanpy (installed automatically with prophet)
Data expected from: app/data/dineflow_multi_item_orders.csv
    columns: date, item, quantity_used
"""

import pandas as pd
from prophet import Prophet


def train_and_forecast(item_df: pd.DataFrame, forecast_days: int = 7,
                        yearly_seasonality: bool = True,
                        weekly_seasonality: bool = True) -> pd.DataFrame:
    """
    Train a Prophet model on one item's history and return the forecast.

    item_df must have columns: ds (date), y (quantity used)
    Returns the full Prophet forecast dataframe (includes yhat, yhat_lower,
    yhat_upper for every date, historical + future).
    """
    model = Prophet(
        yearly_seasonality=yearly_seasonality,
        weekly_seasonality=weekly_seasonality,
        daily_seasonality=False,
        changepoint_prior_scale=0.1,
    )
    model.fit(item_df)

    future = model.make_future_dataframe(periods=forecast_days, freq="D")
    forecast = model.predict(future)
    return forecast


def get_next_n_days_total_demand(forecast: pd.DataFrame, n_days: int = 7) -> float:
    """Sum Prophet's predicted demand (yhat) for the next n_days."""
    return float(forecast.tail(n_days)["yhat"].sum())


def forecast_all_items(orders_csv_path: str, forecast_days: int = 7) -> dict:
    """
    Runs train_and_forecast() for every unique item in the orders CSV.
    Returns: {item_name: total_forecasted_demand_next_n_days}
    This output dict is exactly what app/inference/reorder_engine.py expects
    as its `forecast_dict` input.
    """
    raw = pd.read_csv(orders_csv_path, parse_dates=["date"])
    forecast_totals = {}

    for item in raw["item"].unique():
        item_df = raw[raw["item"] == item][["date", "quantity_used"]].rename(
            columns={"date": "ds", "quantity_used": "y"}
        )
        forecast = train_and_forecast(item_df, forecast_days=forecast_days)
        forecast_totals[item] = get_next_n_days_total_demand(forecast, forecast_days)

    return forecast_totals


# ---- run this file directly to see it working end-to-end ----
if __name__ == "__main__":
    import cmdstanpy
    cmdstanpy.set_cmdstan_path('/root/.cmdstan/cmdstan-2.36.0')  # remove/adjust if not needed on your machine

    forecast_totals = forecast_all_items(
        orders_csv_path="app/data/dineflow_multi_item_orders.csv",
        forecast_days=7,
    )

    print("7-day demand forecast per item:")
    for item, demand in forecast_totals.items():
        print(f"  {item}: {demand:.1f}")
