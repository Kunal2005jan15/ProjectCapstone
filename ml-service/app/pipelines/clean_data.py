from pathlib import Path
import pandas as pd

from app.core.logger import logger
from app.pipelines.load_data import DatasetLoader


class DataCleaner:

    def __init__(self):

        self.loader = DatasetLoader()

        self.output_path = Path("app/data/processed")

        self.output_path.mkdir(exist_ok=True)

    def clean(self, df):

        df = df.copy()

        # Remove duplicate rows
        df = df.drop_duplicates()

        # Standardize column names
        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "_")
        )

        return df

    def save(self, df, filename):

        path = self.output_path / filename

        df.to_csv(path, index=False)

        logger.info(f"Saved {filename}")

    def process_all(self):

        datasets = self.loader.load_all()

        for name, df in datasets.items():

            logger.info(f"Cleaning {name}")

            clean_df = self.clean(df)

            self.save(clean_df, f"{name}.csv")


if __name__ == "__main__":

    cleaner = DataCleaner()

    cleaner.process_all()