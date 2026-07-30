from pathlib import Path

import numpy as np
import pandas as pd

from app.core.logger import logger

INPUT = Path("app/data/processed/model_ready.csv")
OUTPUT = Path("app/data/processed/model_features.csv")


# ==========================================================
# Holiday Distance Features
# ==========================================================

def add_holiday_distance(df):

    holiday_dates = df.loc[df["is_holiday"], "date"]

    before = []
    after = []

    for current in df["date"]:

        previous = holiday_dates[holiday_dates <= current]
        upcoming = holiday_dates[holiday_dates >= current]

        after.append(
            (current - previous.max()).days
            if len(previous)
            else 30
        )

        before.append(
            (upcoming.min() - current).days
            if len(upcoming)
            else 30
        )

    df["days_after_holiday"] = after
    df["days_before_holiday"] = before

    return df


# ==========================================================
# Main Pipeline
# ==========================================================

def engineer_features():

    logger.info("Loading model_ready.csv")

    df = pd.read_csv(INPUT)

    df["date"] = pd.to_datetime(df["date"])

    df["holiday_name"] = (
        df["holiday_name"]
        .fillna("No Holiday")
        .replace("", "No Holiday")
    )

    # ======================================================
    # Calendar Features
    # ======================================================

    logger.info("Creating calendar features...")

    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["day"] = df["date"].dt.day

    df["weekday"] = df["date"].dt.weekday
    df["week"] = df["date"].dt.isocalendar().week.astype(int)

    df["quarter"] = df["date"].dt.quarter
    df["day_of_year"] = df["date"].dt.dayofyear

    df["is_weekend"] = (df["weekday"] >= 5).astype(int)

    df["is_month_start"] = df["date"].dt.is_month_start.astype(int)
    df["is_month_end"] = df["date"].dt.is_month_end.astype(int)

    # ======================================================
    # Cyclical Features
    # ======================================================

    logger.info("Creating cyclical features...")

    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

    df["weekday_sin"] = np.sin(2 * np.pi * df["weekday"] / 7)
    df["weekday_cos"] = np.cos(2 * np.pi * df["weekday"] / 7)

    # ======================================================
    # Trend
    # ======================================================

    logger.info("Creating trend feature...")

    df["time_index"] = np.arange(len(df))

    # ======================================================
    # Lag Features
    # ======================================================

    logger.info("Creating lag features...")

    for lag in [1, 7, 14, 30]:

        df[f"lag_{lag}"] = df["total_sales"].shift(lag)

    # ======================================================
    # Rolling Statistics
    # ======================================================

    logger.info("Creating rolling statistics...")

    for window in [7, 14, 30]:

        df[f"rolling_mean_{window}"] = (
            df["total_sales"]
            .shift(1)
            .rolling(window)
            .mean()
        )

    df["rolling_std_7"] = (
        df["total_sales"]
        .shift(1)
        .rolling(7)
        .std()
    )

    # ======================================================
    # Weather Features
    # ======================================================

    logger.info("Creating weather features...")

    df["is_rain"] = (df["rainfall"] > 5).astype(int)

    df["heavy_rain"] = (df["rainfall"] > 20).astype(int)

    df["is_hot"] = (df["temperature"] > 35).astype(int)

    df["is_cold"] = (df["temperature"] < 15).astype(int)

    # ======================================================
    # Season
    # ======================================================

    logger.info("Creating season feature...")

    def get_season(month):

        if month in [12, 1, 2]:
            return "Winter"

        elif month in [3, 4, 5, 6]:
            return "Summer"

        elif month in [7, 8, 9]:
            return "Monsoon"

        else:
            return "Festive"

    df["season"] = df["month"].apply(get_season)

    # ======================================================
    # Holiday Features
    # ======================================================

    logger.info("Creating holiday features...")

    df = add_holiday_distance(df)

    df["is_festival_week"] = (
        (df["days_before_holiday"] <= 7)
        | (df["days_after_holiday"] <= 2)
    ).astype(int)

    df["weekend_after_holiday"] = (
        (df["is_weekend"] == 1)
        & (df["days_after_holiday"] <= 2)
    ).astype(int)

    # ======================================================
    # Missing Value Report
    # ======================================================

    print("\nMissing Values")
    print("=" * 70)

    print(df.isna().sum())

    # ======================================================
    # Remove only lag rows
    # ======================================================

    required = [

        "lag_1",
        "lag_7",
        "lag_14",
        "lag_30",

        "rolling_mean_7",
        "rolling_mean_14",
        "rolling_mean_30",

        "rolling_std_7",
    ]

    logger.info("Removing rows created by lag features...")

    df = (
        df
        .dropna(subset=required)
        .reset_index(drop=True)
    )

    # ======================================================
    # Save
    # ======================================================

    OUTPUT.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        OUTPUT,
        index=False
    )

    logger.info(f"Saved {OUTPUT}")

    # ======================================================
    # Summary
    # ======================================================

    print("\n")
    print("=" * 70)
    print("MODEL FEATURES DATASET")
    print("=" * 70)

    print(df.head())

    print("\nShape :", df.shape)

    print("\nDate Range")

    print(df["date"].min())
    print(df["date"].max())

    print("\nTarget Statistics")
    print(df["total_sales"].describe())

    print("\nColumns")

    for col in df.columns:
        print(f"• {col}")


if __name__ == "__main__":
    engineer_features()
