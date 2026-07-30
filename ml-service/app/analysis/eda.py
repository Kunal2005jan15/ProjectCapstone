from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

from app.core.logger import logger

INPUT = Path("app/data/processed/model_features.csv")

OUTPUT = Path("reports/eda")
OUTPUT.mkdir(parents=True, exist_ok=True)


def main():

    logger.info("Loading dataset...")

    df = pd.read_csv(INPUT)

    df["date"] = pd.to_datetime(df["date"])

    print("\nDataset Shape")
    print(df.shape)

    print("\nColumns")
    print(df.columns.tolist())

    print("\nMissing Values")
    print(df.isnull().sum())

    print("\nData Types")
    print(df.dtypes)

    print("\nSummary")
    print(df.describe(include="all"))

    # ----------------------------------------------------
    # Sales Trend
    # ----------------------------------------------------

    plt.figure(figsize=(15,5))

    plt.plot(df["date"], df["total_sales"])

    plt.title("Daily Sales")

    plt.tight_layout()

    plt.savefig(OUTPUT / "sales_trend.png")

    plt.close()

    # ----------------------------------------------------
    # Monthly Sales
    # ----------------------------------------------------

    monthly = (
        df.groupby("month")["total_sales"]
        .mean()
    )

    plt.figure(figsize=(10,5))

    monthly.plot(kind="bar")

    plt.title("Average Monthly Sales")

    plt.tight_layout()

    plt.savefig(OUTPUT / "monthly_sales.png")

    plt.close()

    # ----------------------------------------------------
    # Weekday Sales
    # ----------------------------------------------------

    weekday = (
        df.groupby("weekday")["total_sales"]
        .mean()
    )

    plt.figure(figsize=(8,5))

    weekday.plot(kind="bar")

    plt.title("Average Weekday Sales")

    plt.tight_layout()

    plt.savefig(OUTPUT / "weekday_sales.png")

    plt.close()

    # ----------------------------------------------------
    # Holiday
    # ----------------------------------------------------

    plt.figure(figsize=(6,5))

    sns.boxplot(
        x="is_holiday",
        y="total_sales",
        data=df
    )

    plt.tight_layout()

    plt.savefig(OUTPUT / "holiday_effect.png")

    plt.close()

    # ----------------------------------------------------
    # Season
    # ----------------------------------------------------

    plt.figure(figsize=(8,5))

    sns.boxplot(
        x="season",
        y="total_sales",
        data=df
    )

    plt.tight_layout()

    plt.savefig(OUTPUT / "season_effect.png")

    plt.close()

    # ----------------------------------------------------
    # Rain
    # ----------------------------------------------------

    plt.figure(figsize=(6,5))

    sns.boxplot(
        x="is_rain",
        y="total_sales",
        data=df
    )

    plt.tight_layout()

    plt.savefig(OUTPUT / "rain_effect.png")

    plt.close()

    # ----------------------------------------------------
    # Distribution
    # ----------------------------------------------------

    plt.figure(figsize=(8,5))

    sns.histplot(
        df["total_sales"],
        bins=25,
        kde=True
    )

    plt.tight_layout()

    plt.savefig(OUTPUT / "sales_distribution.png")

    plt.close()

    # ----------------------------------------------------
    # Correlation
    # ----------------------------------------------------

    leakage = [
        "total_sales",
        "total_orders",
        "total_items",
        "average_order_value",
        "holiday_name",
        "date",
        "season"
    ]

    corr_df = df.drop(columns=leakage)

    corr = corr_df.corr(numeric_only=True)

    plt.figure(figsize=(14,10))

    sns.heatmap(
        corr,
        cmap="coolwarm",
        center=0
    )

    plt.tight_layout()

    plt.savefig(OUTPUT / "correlation_heatmap.png")

    plt.close()

    target_corr = (
        df.drop(columns=[
            "holiday_name",
            "season",
            "date"
        ])
        .corr(numeric_only=True)["total_sales"]
        .sort_values(ascending=False)
    )

    print("\nCorrelation with Target\n")
    print(target_corr)

    target_corr.to_csv(
        OUTPUT / "target_correlation.csv"
    )

    logger.info("EDA completed successfully.")

    print("\nReports saved to")

    print(OUTPUT.resolve())


if __name__ == "__main__":
    main()