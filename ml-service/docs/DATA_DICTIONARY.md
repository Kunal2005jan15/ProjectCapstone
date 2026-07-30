# Data Dictionary — `model_features.csv`

Every column in `app/data/processed/model_features.csv` (335 rows × 46
columns), what it means, where it comes from, and whether it's safe to use
as a model input. This exists so nobody on the team has to guess what a
column means or accidentally trains on the wrong one.

**Role legend:**
- **target** — what we're predicting
- **feature** — safe to use as model input
- **leakage** — DO NOT use as model input (see `app/core/constants.py`)
- **diagnostic** — informational only, excluded from model input by default
- **id** — identifier/grouping, not a numeric feature as-is

| Column | Meaning | Dtype | Source | Role |
|---|---|---|---|---|
| `date` | Calendar date of the row | date | `aggregate_sales.py` | id |
| `total_sales` | Total sales revenue for the day | float | `aggregate_sales.py` (from pizza orders) | **target** |
| `total_orders` | Number of orders placed that day | int | `aggregate_sales.py` | **leakage** — known only after sales happen |
| `total_items` | Number of items sold that day | int | `aggregate_sales.py` | **leakage** |
| `average_order_value` | total_sales / total_orders for the day | float | `aggregate_sales.py` | **leakage** |
| `data_missing` | True if this day had no raw order rows and was calendar-filled with 0 (not a confirmed zero-sales day) | bool | `aggregate_sales.py` | diagnostic |
| `temperature` | Average daily temperature | float | NASA POWER API via `fetch_weather.py` | feature |
| `max_temperature` | Daily max temperature | float | NASA POWER API | feature |
| `min_temperature` | Daily min temperature | float | NASA POWER API | feature |
| `rainfall` | Daily rainfall | float | NASA POWER API | feature |
| `humidity` | Daily average humidity | float | NASA POWER API | feature |
| `wind_speed` | Daily average wind speed | float | NASA POWER API | feature |
| `is_holiday` | Whether the date is an Indian public holiday | bool | `generate_holidays.py` | feature |
| `holiday_name` | Name of the holiday, empty string if none | string | `generate_holidays.py` | excluded (string, use `is_holiday`/distance features instead) |
| `year` | Calendar year | int | `feature_engineering.py` | feature (constant in this dataset — single year, effectively no signal) |
| `month` | Calendar month (1-12) | int | `feature_engineering.py` | feature |
| `day` | Day of month | int | `feature_engineering.py` | feature |
| `weekday` | Day of week (0=Mon..6=Sun) | int | `feature_engineering.py` | feature |
| `week` | ISO week number | int | `feature_engineering.py` | feature |
| `quarter` | Calendar quarter (1-4) | int | `feature_engineering.py` | feature |
| `day_of_year` | Day number within the year (1-365) | int | `feature_engineering.py` | feature |
| `is_weekend` | 1 if Saturday/Sunday | int | `feature_engineering.py` | feature |
| `is_month_start` | 1 if first day of month | int | `feature_engineering.py` | feature |
| `is_month_end` | 1 if last day of month | int | `feature_engineering.py` | feature |
| `month_sin` / `month_cos` | Cyclical (sin/cos) encoding of month, so December and January are numerically close | float | `feature_engineering.py` | feature |
| `weekday_sin` / `weekday_cos` | Cyclical encoding of weekday | float | `feature_engineering.py` | feature |
| `time_index` | Sequential integer counting days from the dataset's start (captures overall trend) | int | `feature_engineering.py` | feature |
| `lag_1` | total_sales from 1 day ago | float | `feature_engineering.py` | feature |
| `lag_7` | total_sales from 7 days ago | float | `feature_engineering.py` | feature |
| `lag_14` | total_sales from 14 days ago | float | `feature_engineering.py` | feature |
| `lag_30` | total_sales from 30 days ago | float | `feature_engineering.py` | feature |
| `rolling_mean_7` / `_14` / `_30` | Rolling average of total_sales over the trailing 7/14/30 days | float | `feature_engineering.py` | feature |
| `rolling_std_7` | Rolling standard deviation of total_sales over trailing 7 days | float | `feature_engineering.py` | feature |
| `is_rain` | 1 if rainfall > 5 that day | int | `feature_engineering.py` | feature |
| `heavy_rain` | 1 if rainfall > 20 that day | int | `feature_engineering.py` | feature |
| `is_hot` | 1 if temperature > 35 | int | `feature_engineering.py` | feature |
| `is_cold` | 1 if temperature < 15 | int | `feature_engineering.py` | feature |
| `season` | Winter (Dec/Jan/Feb) / Summer / Monsoon / Festive, derived from month | string | `feature_engineering.py` | excluded (string — encode it, or rely on `month_sin`/`month_cos` which already capture this numerically) |
| `days_after_holiday` | Days elapsed since the most recent holiday | int | `feature_engineering.py` | feature |
| `days_before_holiday` | Days remaining until the next holiday | int | `feature_engineering.py` | feature |
| `is_festival_week` | 1 if within 7 days before or 2 days after a holiday | int | `feature_engineering.py` | feature |
| `weekend_after_holiday` | 1 if a weekend day within 2 days after a holiday | int | `feature_engineering.py` | feature |

## Quick reference

- **Target column:** `total_sales`
- **Never use as input:** `total_orders`, `total_items`, `average_order_value` (target leakage)
- **Excluded by default, available to inspect:** `data_missing`, `date`, `holiday_name`, `season`
- **Everything else (38 columns):** safe numeric model input

To get the exact safe feature list programmatically instead of copying this
table by hand:

```python
from app.core.constants import get_model_feature_columns
feature_cols = get_model_feature_columns(df)
```
