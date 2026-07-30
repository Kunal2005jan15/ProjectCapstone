import json
from pathlib import Path

import pandas as pd

from app.core.logger import logger
from app.pipelines.load_data import DatasetLoader


class DataValidator:

    def __init__(self):

        self.results = {}

    def validate(self, dataset_name, df):

        logger.info(f"Validating {dataset_name}")

        report = {}

        report["rows"] = int(df.shape[0])
        report["columns"] = int(df.shape[1])

        report["memory_mb"] = round(
            df.memory_usage(deep=True).sum() / 1024 / 1024,
            2,
        )

        report["duplicate_rows"] = int(
            df.duplicated().sum()
        )

        report["missing_values"] = (
            df.isnull().sum().to_dict()
        )

        report["missing_percent"] = {
            c: round(df[c].isnull().mean() * 100, 2)
            for c in df.columns
        }

        report["data_types"] = {
            c: str(df[c].dtype)
            for c in df.columns
        }

        report["unique_values"] = {
            c: int(df[c].nunique())
            for c in df.columns
        }

        report["empty_columns"] = [
            c
            for c in df.columns
            if df[c].isnull().all()
        ]

        negatives = {}

        for col in df.select_dtypes(include="number"):

            count = int((df[col] < 0).sum())

            if count > 0:
                negatives[col] = count

        report["negative_values"] = negatives

        report["date_columns"] = []

        for col in df.columns:

            if "date" in col.lower():

                try:

                    pd.to_datetime(df[col])

                    report["date_columns"].append(col)

                except Exception:

                    pass

        score = 100

        score -= len(report["empty_columns"]) * 10

        score -= report["duplicate_rows"] * 0.01

        total_missing = sum(
            report["missing_values"].values()
        )

        score -= total_missing * 0.01

        report["quality_score"] = round(max(score, 0), 2)

        self.results[dataset_name] = report

    def save(self):

        output = Path(
            "app/data/reports/validation_report.json"
        )

        with open(output, "w") as f:

            json.dump(
                self.results,
                f,
                indent=4,
            )

        logger.info("Validation report generated.")


if __name__ == "__main__":

    loader = DatasetLoader()

    validator = DataValidator()

    datasets = loader.load_all()

    for name, df in datasets.items():

        validator.validate(name, df)

    validator.save()

    print()

    print("=" * 60)

    print("VALIDATION COMPLETE")

    print("=" * 60)

    for dataset, report in validator.results.items():

        print(
            f"{dataset:<30}"
            f"Score: {report['quality_score']}"
        )