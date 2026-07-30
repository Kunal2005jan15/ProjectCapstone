from pathlib import Path

import pandas as pd

from app.core.logger import logger


class DatasetLoader:
    """
    Loads all raw datasets used in the ML pipeline.

    Supports:
    - CSV
    - XLSX

    Automatically handles common CSV encodings.
    """

    def __init__(self):

        self.base_path = Path("app/data/raw")

        self.datasets = {

            # ---------------- Pizza ---------------- #

            "pizza_orders":
                self.base_path / "pizza" / "orders.csv",

            "pizza_order_details":
                self.base_path / "pizza" / "order_details.csv",

            "pizza_pizzas":
                self.base_path / "pizza" / "pizzas.csv",

            "pizza_types":
                self.base_path / "pizza" / "pizza_types.csv",

            # ---------------- Coffee ---------------- #

            "coffee_orders":
                self.base_path / "coffee" / "orders.csv",

            "coffee_inventory":
                self.base_path / "coffee" / "inventory.csv",

            "coffee_items":
                self.base_path / "coffee" / "items.csv",

            "coffee_recipe":
                self.base_path / "coffee" / "recipe.csv",

            "coffee_ingredients":
                self.base_path / "coffee" / "ingredients.csv",

            # ---------------- Consumer ---------------- #

            "consumer_ratings":
                self.base_path / "consumer" / "rating_final.csv",

            "consumer_profile":
                self.base_path / "consumer" / "userprofile.csv",

            "consumer_places":
                self.base_path / "consumer" / "geoplaces2.csv",

            "consumer_cuisine":
                self.base_path / "consumer" / "usercuisine.csv",

            # ---------------- Restaurant Orders ---------------- #

            "restaurant_orders":
                self.base_path
                / "restaurant_orders"
                / "hotel_restaurant_orders.csv",

            # ---------------- Restaurant Sales ---------------- #

            "restaurant_sales":
                self.base_path
                / "restaurant_sales"
                / "restaurant_sales_data.csv",
        }

    def _read_csv(self, path: Path):
        """
        Try multiple encodings until one succeeds.
        """

        encodings = [
            "utf-8",
            "utf-8-sig",
            "cp1252",
            "latin1",
        ]

        last_exception = None

        for encoding in encodings:

            try:

                logger.info(f"Trying encoding: {encoding}")

                df = pd.read_csv(path, encoding=encoding)

                logger.info(f"Loaded using {encoding}")

                return df

            except UnicodeDecodeError as e:

                logger.warning(f"Encoding {encoding} failed.")

                last_exception = e

        raise last_exception

    def load(self, dataset_name: str):

        if dataset_name not in self.datasets:
            raise ValueError(f"Unknown dataset: {dataset_name}")

        path = self.datasets[dataset_name]

        logger.info("=" * 60)
        logger.info(f"Loading dataset: {dataset_name}")
        logger.info(f"Location: {path}")

        try:

            if path.suffix.lower() == ".xlsx":

                df = pd.read_excel(path)

            else:

                df = self._read_csv(path)

            logger.info(
                f"SUCCESS | {dataset_name}: "
                f"{df.shape[0]} rows × {df.shape[1]} columns"
            )

            return df

        except Exception as e:

            logger.exception(
                f"FAILED loading dataset: {dataset_name}"
            )

            raise e

    def load_all(self):

        loaded = {}

        logger.info("\nStarting dataset loading...\n")

        for dataset_name in self.datasets:

            loaded[dataset_name] = self.load(dataset_name)

        logger.info("\nAll datasets loaded successfully.\n")

        return loaded


if __name__ == "__main__":

    loader = DatasetLoader()

    datasets = loader.load_all()

    print("\n" + "=" * 70)
    print("DATASET SUMMARY")
    print("=" * 70)

    for name, df in datasets.items():

        print(
            f"{name:<30}"
            f"{df.shape[0]:>8} rows"
            f"   {df.shape[1]:>3} columns"
        )