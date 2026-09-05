"""
STEP 7 — Model Evaluation

Scores each trained model against its held-out test window using MAE
and MAPE.

Run directly: python -m app.modeling.evaluate_model
"""
from prophet import Prophet
from app.config import WEATHER_BAKERY_CSV
import numpy as np
import pandas as pd

from app.modeling.train_test_split import (
    load_processed, split_train_test, eligible_items, to_prophet_frame,
)
from app.modeling.train_model import train_one


def mae(y_true, y_pred) -> float:
    return float(np.mean(np.abs(np.array(y_true) - np.array(y_pred))))


def mape(y_true, y_pred) -> float:
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    mask = y_true != 0
    if mask.sum() == 0:
        return float("nan")
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def evaluate_all() -> pd.DataFrame:
    df = load_processed()
    items = eligible_items(df)
    results = []

    for source, item in items:
        item_df = df[(df["source"] == source) & (df["item_name"] == item)]
        train_df, test_df = split_train_test(item_df)
        if test_df.empty:
            continue

        model = train_one(train_df, source)
        future = to_prophet_frame(test_df)[["ds"]]
        forecast = model.predict(future)

        y_true = to_prophet_frame(test_df)["y"].values
        y_pred = forecast["yhat"].values

        results.append({
            "source": source, "item_name": item,
            "mae": mae(y_true, y_pred), "mape": mape(y_true, y_pred),
            "test_rows": len(test_df),
        })

    return pd.DataFrame(results).sort_values("mae")

def evaluate_weather_effect_bakery():
    """Backtested only — not part of the live prediction path, since future
    weather isn't known at forecast time. Confirms whether weather is worth
    building into a real forecast-API-based extension later."""
    weather = pd.read_csv(WEATHER_BAKERY_CSV, parse_dates=["date"])
    df = load_processed()
    bakery_items = [item for src, item in eligible_items(df) if src == "bakery"]

    results = []
    for item in bakery_items:
        item_df = df[(df["source"] == "bakery") & (df["item_name"] == item)].merge(weather, on="date", how="left")
        train_df, test_df = split_train_test(item_df)
        if test_df.empty or train_df["temperature"].isna().all():
            continue

        m_plain = train_one(train_df, "bakery")
        m_weather = Prophet(weekly_seasonality=True, yearly_seasonality=True, daily_seasonality=False)
        m_weather.add_country_holidays(country_name="GB")
        m_weather.add_regressor("temperature")
        m_weather.fit(to_prophet_frame(train_df).assign(temperature=train_df["temperature"].values))

        future_plain = to_prophet_frame(test_df)[["ds"]]
        future_weather = future_plain.assign(temperature=test_df["temperature"].values)

        y_true = to_prophet_frame(test_df)["y"].values
        mae_plain = mae(y_true, m_plain.predict(future_plain)["yhat"].values)
        mae_weather = mae(y_true, m_weather.predict(future_weather)["yhat"].values)

        results.append({"item_name": item, "mae_without_weather": mae_plain, "mae_with_weather": mae_weather})

    return pd.DataFrame(results)


if __name__ == "__main__":
    results = evaluate_all()
    print(results.to_string(index=False))
    print()
    print("summary by source:")
    print(results.groupby("source")[["mae", "mape"]].mean())
    weather_results = evaluate_weather_effect_bakery()
    print(weather_results.to_string(index=False))