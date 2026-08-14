"""
STEP 6 — Model Training

Trains one Prophet model per eligible item (or per category, if per-item
history is too sparse — check the notebook's "days of history per item"
section to decide which granularity to use).

Run directly: python -m app.modeling.train_model
"""

from prophet import Prophet
from app.config import SOURCE_HOLIDAY_COUNTRY
from app.modeling.train_test_split import (
    load_processed, split_train_test, eligible_items, to_prophet_frame,
)


def train_one(train_df, source: str) -> Prophet:
    model = Prophet(
        weekly_seasonality=True,
        yearly_seasonality=True,
        daily_seasonality=False,
    )
    country = SOURCE_HOLIDAY_COUNTRY.get(source)
    if country:
        model.add_country_holidays(country_name=country)
    model.fit(to_prophet_frame(train_df))
    return model


def train_all():
    df = load_processed()
    items = eligible_items(df)
    trained = {}
    for source, item in items:
        item_df = df[(df["source"] == source) & (df["item_name"] == item)]
        train_df, _ = split_train_test(item_df)
        print(f"training {source}/{item} on {len(train_df)} rows (holidays: {SOURCE_HOLIDAY_COUNTRY.get(source)})...")
        trained[(source, item)] = train_one(train_df, source)
    return trained


if __name__ == "__main__":
    models = train_all()
    print(f"trained {len(models)} models")