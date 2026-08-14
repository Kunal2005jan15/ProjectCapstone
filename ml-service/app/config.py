"""
Central place for every path used across the pipeline.
Nothing else in this codebase should hardcode a path like "../data/raw/...".
Import from here instead, e.g.:

    from app.config import PIZZA_ORDERS_CSV, PROCESSED_DIR
"""

from pathlib import Path

# ---- Root locations -------------------------------------------------------

APP_DIR = Path(__file__).resolve().parent
ML_SERVICE_DIR = APP_DIR.parent

DATA_DIR = APP_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
EXTERNAL_DIR = DATA_DIR / "external"
PROCESSED_DIR = DATA_DIR / "processed"

MODELS_DIR = ML_SERVICE_DIR / "models_store"
REPORTS_DIR = ML_SERVICE_DIR / "reports" / "eda"

# ---- Track A: item-level food data (notebook 01) ---------------------------

# Pizza Place Sales (Kaggle) — one full year, item-level, no location published
PIZZA_ORDERS_CSV = RAW_DIR / "pizza" / "orders.csv"
PIZZA_ORDER_DETAILS_CSV = RAW_DIR / "pizza" / "order_details.csv"
PIZZA_TYPES_CSV = RAW_DIR / "pizza" / "pizza_types.csv"
PIZZA_PIZZAS_CSV = RAW_DIR / "pizza" / "pizzas.csv"

# Bakery Sales / "The Bread Basket" (Kaggle) — real single location: Edinburgh, Scotland
BAKERY_SALES_CSV = RAW_DIR / "bakery" / "Bakery.csv"
BAKERY_LAT, BAKERY_LON = 55.9533, -3.1883  # Edinburgh — known by dataset description, not assumed

# ---- Track B: weather validation (notebook 02) ------------------------------

# Walmart Store Sales Forecasting (Kaggle) — weekly, per store, weather
# (Temperature) already merged per store's region — no geocoding needed.
WALMART_TRAIN_CSV = RAW_DIR / "walmart" / "train.csv"
WALMART_FEATURES_CSV = RAW_DIR / "walmart" / "features.csv"
WALMART_STORES_CSV = RAW_DIR / "walmart" / "stores.csv"

# ---- Processed / output files ----------------------------------------------

SALES_DAILY_PROCESSED_CSV = PROCESSED_DIR / "sales_daily.csv"
SALES_DAILY_NORMALIZED_CSV = PROCESSED_DIR / "sales_daily_normalized.csv"
FEATURE_SCALER_PATH = PROCESSED_DIR / "feature_scaler.joblib"
WALMART_WEATHER_COMPARISON_CSV = PROCESSED_DIR / "walmart_weather_mae_comparison.csv"

# ---- Model storage ----------------------------------------------------------
# ---- Known locations, by data source ---------------------------------------
# Bakery Sales dataset is confirmed as a single real bakery in Edinburgh,
# Scotland — this is a real, documented location, not an assumption.
# Pizza Place Sales has no published location at all.
SOURCE_LOCATIONS = {
    "bakery": (BAKERY_LAT, BAKERY_LON),   # real — Edinburgh
    "pizza": None,                          # still unknown — no weather for this source
}

# Country used for Prophet's built-in holiday calendar per source.
# "GB" for bakery is a real fact (Edinburgh). "US" for pizza is an
# ASSUMPTION based on USD pricing in the dataset — not a confirmed location.
# State this distinction explicitly in the findings write-up.
SOURCE_HOLIDAY_COUNTRY = {
    "bakery": "GB",
    "pizza": "US",   # assumption — flag in report
}

WEATHER_BAKERY_CSV = EXTERNAL_DIR / "weather" / "weather_bakery_edinburgh.csv"


def model_path_for(source: str, item_name: str) -> Path:
    """One trained model per (source, item), named like prophet__bakery_coffee.joblib"""
    safe_key = f"{source}_{item_name}".lower().replace(" ", "_").replace("/", "-")
    return MODELS_DIR / f"prophet__{safe_key}.joblib"


for _dir in (RAW_DIR, EXTERNAL_DIR, PROCESSED_DIR, MODELS_DIR, REPORTS_DIR):
    _dir.mkdir(parents=True, exist_ok=True)



    # ---- Backend integration (push architecture) --------------------------------
BACKEND_BASE_URL = "http://localhost:8080"  # override via env var in real deployment
BACKEND_FORECAST_PATH = "/api/v1/shops/{shop_id}/forecasts"

ITEM_MAPPING_PATH = APP_DIR / "integration" / "item_mapping.json"

BACKEND_AUTH_TOKEN_ENV_VAR = "ML_PUSH_AUTH_TOKEN"