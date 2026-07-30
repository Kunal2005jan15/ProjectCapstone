# ML Service — EDA & Preprocessing Handoff

**Owner (this doc):** Project Lead / EDA
**Status:** Preprocessing + EDA complete, ready for model training team
**Last updated:** 2026-07-30

This is a factual summary of what exists in `ml-service/` right now. Nothing
below is aspirational — every item is a file that's actually in the repo.

---

## 1. What's done

### 1.1 Data ingestion (`app/pipelines/`)
- `load_data.py`, `clean_data.py` — load and clean raw source data from
  `app/data/raw/` (coffee, pizza, restaurant_orders, restaurant_sales,
  consumer datasets).
- `validate_data.py` → `app/data/reports/validation_report.json` — per-dataset
  row counts, missing-value %, duplicate counts, and a quality score for
  every raw source table.
- `fetch_weather.py` → `app/data/external/weather/weather_india.csv` — daily
  weather pulled from the NASA POWER API.
- `generate_holidays.py` → `app/data/external/holidays/holidays_india.csv` —
  Indian holiday calendar.
- `aggregate_sales.py` → `app/data/processed/daily_sales.csv` — raw sales
  aggregated to one row per day.
- `build_training_dataset.py` → `app/data/processed/model_ready.csv` — daily
  sales joined with weather + holiday data.

### 1.2 Feature engineering (`app/pipelines/feature_engineering.py`)
Reads `model_ready.csv`, writes `app/data/processed/model_features.csv`.
Adds:
- Calendar features: year, month, day, weekday, week, quarter, day_of_year,
  is_weekend, is_month_start, is_month_end
- Cyclical encodings: month_sin/cos, weekday_sin/cos
- Trend: `time_index`
- Lag features: `lag_1`, `lag_7`, `lag_14`, `lag_30` (on total_sales)
- Rolling stats: `rolling_mean_{7,14,30}`, `rolling_std_7`
- Weather flags: `is_rain`, `heavy_rain`, `is_hot`, `is_cold`
- `season` (Winter/Summer/Monsoon/Festive)
- Holiday-distance features: `days_after_holiday`, `days_before_holiday`,
  `is_festival_week`, `weekend_after_holiday`

Rows affected by the lag/rolling window (the first 30 rows, where those
features are undefined) are dropped. **Result: 335 rows × 38 columns**,
date range 2015-01-31 to 2015-12-31, zero missing values.

### 1.3 EDA (`app/analysis/eda.py`)
Run via `python -m app.analysis.eda`. Produces, in `reports/eda/`:
- `sales_trend.png` — daily sales over the full date range
- `monthly_sales.png` — average sales by month
- `weekday_sales.png` — average sales by weekday
- `holiday_effect.png`, `season_effect.png`, `rain_effect.png` — boxplots of
  sales vs. each factor
- `sales_distribution.png` — histogram of total_sales
- `correlation_heatmap.png` + `target_correlation.csv` — correlation of every
  candidate feature against total_sales

### 1.4 Shared config (`app/core/constants.py`)
New file added to close the leakage gap below. Defines:
- `TARGET_COLUMN = "total_sales"`
- `LEAKAGE_COLUMNS = ["total_orders", "total_items", "average_order_value"]`
- `NON_FEATURE_COLUMNS = ["date", "holiday_name", "season"]`
- `get_model_feature_columns(df)` — returns the safe-to-use feature list

---

## 2. Important — target leakage, now fixed at the config level

The correlation results ranked these as the strongest predictors of
`total_sales`:

| Feature | Correlation |
|---|---|
| total_items | 0.996 |
| total_orders | 0.931 |
| average_order_value | 0.626 |
| lag_7 | 0.343 |
| lag_14 | 0.278 |

The top three are **not usable as model inputs**. They're computed from the
same day's sales, so they won't exist yet at prediction time for a future
day — a model trained on them will look excellent offline and then fail in
production. `eda.py` already excludes them from the heatmap; they're now
also excluded centrally in `app/core/constants.py` via
`get_model_feature_columns()`.

**Model training team: import your feature list from there instead of
hand-picking columns:**

```python
from app.core.constants import TARGET_COLUMN, get_model_feature_columns

df = pd.read_csv("app/data/processed/model_features.csv")
feature_cols = get_model_feature_columns(df)

X = df[feature_cols]
y = df[TARGET_COLUMN]
```

The remaining features (lag_7, lag_14, lag_1, rolling means, holiday
distance, weekday/month, weather flags) are legitimate — each depends only
on information available on or before the day being predicted.

---

## 3. Known caveats

- **Small dataset**: 335 days, single calendar year (2015). Train/test
  splitting should be time-based (e.g. last ~20% of dates as holdout), not
  random, since this is time series.
- **`season` and `holiday_name`** are strings — encode (one-hot or similar)
  before feeding to most model families, or drop `season` in favor of the
  cyclical month features which already capture seasonality numerically.
- **Weekday correlation is weak** (0.049) and several raw calendar columns
  (`day_of_year`, `week`, `year`) show negative or near-zero correlation —
  worth model-team judgment on whether to keep, drop, or let regularization
  handle them.
- `app/features/feature_engineering.py` (the `FeatureEngineer` class) is an
  early, unused stub — the pipeline that actually produced
  `model_features.csv` is `app/pipelines/feature_engineering.py`. Don't
  confuse the two.

---

## 4. Next tasks (Model Training team)

1. Load `app/data/processed/model_features.csv`, get features via
   `get_model_feature_columns()` above.
2. Time-based train/test split.
3. Train and compare candidate models (e.g. Prophet, XGBoost/LightGBM,
   linear baseline) using MAE, RMSE, MAPE.
4. Save the selected model (`.pkl`/`.joblib`) under `app/models/`.
5. Build the prediction endpoint in `app/prediction/` / `app/routers/` for
   the backend team to call.

## 5. What Backend / Frontend need from this

- Backend: the prediction API contract (once built) will live in
  `app/routers/` — coordinate the response schema before wiring up.
- Frontend: no direct dependency yet; will need forecast output format once
  the prediction endpoint exists.