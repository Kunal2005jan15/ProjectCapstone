import pandas as pd
from pathlib import Path

from app.core.logger import logger

PROCESSED = Path("app/data/processed")
EXTERNAL = Path("app/data/external")


def build_training_dataset():

    logger.info("Loading datasets...")

    sales = pd.read_csv(
        PROCESSED / "daily_sales.csv",
        parse_dates=["date"]
    )

    weather = pd.read_csv(
        EXTERNAL / "weather" / "weather_india.csv",
        parse_dates=["date"]
    )

    holidays = pd.read_csv(
        EXTERNAL / "holidays" / "holidays_india.csv",
        parse_dates=["date"]
    )

    logger.info("Merging Sales + Weather")

    df = sales.merge(
        weather,
        on="date",
        how="left"
    )

    logger.info("Merging Holidays")

    df = df.merge(
        holidays,
        on="date",
        how="left"
    )

    df["is_holiday"] = df["is_holiday"].fillna(False)

    df["holiday_name"] = (
        df["holiday_name"]
        .fillna("")
    )

    output = PROCESSED / "model_ready.csv"

    df.to_csv(
        output,
        index=False
    )

    logger.info(f"Saved {output}")

    print("\nModel Dataset\n")
    print(df.head())

    print("\nShape:", df.shape)


if __name__ == "__main__":
    build_training_dataset()