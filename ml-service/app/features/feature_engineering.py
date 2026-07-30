import pandas as pd


class FeatureEngineer:

    def create_datetime_features(self, df, date_column):

        df = df.copy()

        df[date_column] = pd.to_datetime(df[date_column])

        df["year"] = df[date_column].dt.year
        df["month"] = df[date_column].dt.month
        df["day"] = df[date_column].dt.day
        df["weekday"] = df[date_column].dt.weekday
        df["week"] = df[date_column].dt.isocalendar().week
        df["quarter"] = df[date_column].dt.quarter
        df["is_weekend"] = df["weekday"] >= 5

        return df