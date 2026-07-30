import pandas as pd
from pathlib import Path

from app.pipelines.load_data import DatasetLoader
from app.core.logger import logger

OUTPUT = Path("app/data/processed")
OUTPUT.mkdir(parents=True, exist_ok=True)


def aggregate_pizza_sales():

    logger.info("Loading datasets...")

    loader = DatasetLoader()

    orders = loader.load("pizza_orders")
    order_details = loader.load("pizza_order_details")
    pizzas = loader.load("pizza_pizzas")

    logger.info("Merging datasets...")

    df = (
        order_details
        .merge(
            pizzas,
            on="pizza_id",
            how="left"
        )
        .merge(
            orders,
            on="order_id",
            how="left"
        )
    )

    df["revenue"] = df["quantity"] * df["price"]

    logger.info("Aggregating daily sales...")

    daily = (
        df.groupby("date")
        .agg(
            total_sales=("revenue", "sum"),
            total_orders=("order_id", "nunique"),
            total_items=("quantity", "sum"),
            average_order_value=("revenue", "mean")
        )
        .reset_index()
    )

    daily["date"] = pd.to_datetime(daily["date"])

    logger.info("Creating complete calendar...")

    calendar = pd.DataFrame({
        "date": pd.date_range(
            start=daily["date"].min(),
            end=daily["date"].max(),
            freq="D"
        )
    })

    logger.info("Filling missing days...")

    daily = calendar.merge(
        daily,
        on="date",
        how="left"
    )

    daily["total_sales"] = daily["total_sales"].fillna(0)

    daily["total_orders"] = daily["total_orders"].fillna(0)

    daily["total_items"] = daily["total_items"].fillna(0)

    daily["average_order_value"] = (
        daily["average_order_value"]
        .fillna(0)
    )

    daily["total_orders"] = daily["total_orders"].astype(int)
    daily["total_items"] = daily["total_items"].astype(int)

    output_file = OUTPUT / "daily_sales.csv"

    daily.to_csv(
        output_file,
        index=False
    )

    logger.info(f"Saved {output_file}")

    print("\nDaily Sales Dataset")
    print("=" * 60)
    print(daily.head())

    print("\nMissing sales days:")
    print((daily["total_sales"] == 0).sum())

    print("\nDataset Shape:", daily.shape)

    return daily


if __name__ == "__main__":
    aggregate_pizza_sales()