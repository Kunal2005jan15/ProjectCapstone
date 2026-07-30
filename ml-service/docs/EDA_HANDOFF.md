# ML Service — EDA & Preprocessing Handoff

**Owner (this doc):** Project Lead / EDA
**Status:** Preprocessing + EDA complete, ready for model training team
**Last updated:** 2026-07-30

This is a factual summary of what exists in `ml-service/` right now — written
for a team that's new to this project. Nothing below is aspirational, every
item is a file that's actually in the repo, and every number is from an
actual run of the pipeline.

---

## 1. What's done

### 1.1 Data ingestion (`app/pipelines/`)
- `load_data.py`, `clean_data.py` — load and clean raw source data from
  `app/data/raw/` (coffee, pizza, restaurant_orders, restaurant_sales,
  consumer datasets — 5 raw sources total, see §4 for which one is actually
  used).
- `validate_data.py` → `app/data/reports/validation_report.json` — per-dataset
  row counts, missing-value %, duplicate counts, and a quality score for
  every raw source table.
- `fetch_weather.py` → `app/data/external/weather/weather_india.csv` — daily
  weather pulled from the NASA POWER API, full 2015-01-01 to 2015-12-31
  coverage, no gaps.
- `generate_holidays.py` → `app/data/external/holidays/holidays_india.csv` —
  Indian holiday calendar, same full coverage.
- `aggregate_sales.py` → `app/data/processed/daily_sales.csv` — raw pizza
  sales aggregated to one row per day, calendar-completed to 365 days.
- `build_training_dataset.py` → `app/data/processed/model_ready.csv` — daily
  sales joined with weather + holiday data.

### 1.2 Feature engineering (`app/pipelines/feature_engineering.py`)
Reads `model_ready.csv`, writes `app/data/processed/model_features.csv`.
Adds calendar features, cyclical encodings, trend index, lag features
(1/7/14/30 days), rolling stats (mean/std over 7/14/30 days), weather flags,
season, and holiday-distance features. Rows affected by the lag/rolling
window (the first 30) are dropped.

**Result: 335 rows x 46 columns**, date range 2015-01-31 to 2015-12-31,
zero missing values.

### 1.3 EDA (`app/analysis/eda.py`)
Run via `python -m app.analysis.eda`. Produces, in `reports/eda/`:
`sales_trend.png`, `monthly_sales.png`, `weekday_sales.png`,
`holiday_effect.png`, `season_effect.png`, `rain_effect.png`,
`sales_distribution.png`, `correlation_heatmap.png` +
`target_correlation.csv`.

### 1.4 Shared config (`app/core/constants.py`)
New file, added to close two data-quality gaps found during EDA review
(sections 2 and 3 below). Defines `TARGET_COLUMN`, `LEAKAGE_COLUMNS`,
`NON_FEATURE_COLUMNS`, and `get_model_feature_columns(df)` — the single
place the model-training team should get their feature list from.

---

## 2. Target leakage — fixed at the config level

The correlation results ranked these as the strongest predictors of
`total_sales`: `total_items` (0.996), `total_orders` (0.931),
`average_order_value` (0.626). All three are **not usable as model inputs**
— they're computed from the same day's sales, so they won't exist yet at
prediction time for a future day. A model trained on them will look
excellent offline and then fail in production.

## 3. Data gap — 7 zero-sales days are calendar fill-ins, not real zeros

`aggregate_sales.py` builds a complete 365-day calendar and fills any day
missing from the raw pizza order data with `total_sales = 0`, so the time
series has no date gaps. Checking which 7 days actually got filled:

| Date | Day |
|---|---|
| 2015-09-24 | Thursday |
| 2015-09-25 | Friday |
| 2015-10-05 | Monday |
| 2015-10-12 | Monday |
| 2015-10-19 | Monday |
| 2015-10-26 | Monday |
| 2015-12-25 | Friday |

Dec 25 (Christmas) is plausibly a real closure. But every Monday in October
being zero, with no other Mondays in the dataset zeroed, looks like a gap in
the raw source data for that stretch rather than a genuine "closed every
Monday in October" pattern.

**Fix applied:** `aggregate_sales.py` now adds a `data_missing` boolean
column — `True` for any day that was calendar-filled rather than backed by
real order rows. It's carried through `model_ready.csv` and
`model_features.csv` automatically (verified end to end). `get_model_feature_columns()`
excludes it from the default feature list (it's a diagnostic flag, not a
predictive signal), but it's still in the CSV for the model team to filter on.

---

## 4. For the Model Training team — which dataset to use, and how

**Use `app/data/processed/model_features.csv`.** That's the final,
feature-engineered file — not `daily_sales.csv` or `model_ready.csv`, which
are intermediate steps.

```python
import pandas as pd
from app.core.constants import TARGET_COLUMN, get_model_feature_columns

df = pd.read_csv("app/data/processed/model_features.csv")

# Optional but recommended first: look at the 7 flagged days before
# deciding whether to drop them, keep them, or dig into the raw pizza
# order data to confirm whether they're real closures or a source gap.
print(df[df["data_missing"]][["date", "total_sales"]])

feature_cols = get_model_feature_columns(df)   # 38 safe columns
X = df[feature_cols]
y = df[TARGET_COLUMN]
```

Practical notes since this is everyone's first pass at this:
- **This is time series** — split train/test by date (e.g. last ~20% of
  dates as holdout), not a random shuffle, or you'll leak future
  information into training.
- **335 rows, single calendar year (2015)** — small dataset. Simpler models
  (regularized linear, gradient boosting with shallow trees, Prophet) are
  likely to generalize better than anything complex/deep.
- `season` and `holiday_name` are strings — encode them (one-hot or similar)
  if your model needs numeric input, or lean on `month_sin`/`month_cos`
  which already encode seasonality numerically.
- `app/features/feature_engineering.py` (the `FeatureEngineer` class) is an
  early, unused stub — the pipeline that actually produced
  `model_features.csv` is `app/pipelines/feature_engineering.py`. Don't
  confuse the two.
- Suggested next steps: time-based split -> train a couple of candidate
  models (e.g. a linear/Prophet baseline plus one gradient-boosted tree
  model) -> compare with MAE, RMSE, MAPE -> save the winner under
  `app/models/` as `.pkl`/`.joblib`.

---

## 5. For the Backend team

- The only dataset currently flowing end-to-end is **pizza sales**
  (`app/data/raw/pizza/`). The coffee, restaurant, and consumer datasets
  under `app/data/raw/` were loaded and validated
  (`validation_report.json`) but are not part of the current
  `daily_sales.csv` -> `model_features.csv` pipeline. If the product is
  meant to support other restaurant types, that's an open scope question
  worth raising with the team, not an assumption already made here.
- No prediction API exists yet — `app/routers/`, `app/prediction/`, and
  `app/schemas/` are all empty placeholder folders. Once the model team
  saves a trained model, the next step is a `/forecast` (or similar)
  endpoint in `app/routers/` that loads it and returns predictions.
- **Coordinate the response schema before that endpoint is built** — agree
  with the model team on what a forecast request/response looks like (e.g.
  date range in, predicted sales + confidence interval out) so you're not
  reworking the contract later.
- Recall the earlier open question about `CustomerSession` / `/recommend`
  from the docs handoff — confirm that's actually being built before
  anything depends on a `session_id` that might not exist.

## 6. For the Frontend team

- Nothing to build against yet on the ML side — there's no live endpoint.
- Once the backend's forecast endpoint contract is agreed (see section 5),
  you'll want to design around: a date-indexed sales forecast (likely a
  time series chart), and probably a way to show which historical days were
  flagged `data_missing` if that's surfaced to the shop owner (e.g. "no data
  for this day" vs. "confirmed zero sales" — a small UX distinction but a
  real one, given section 3 above).
- If you need sample response shapes to start on layout before the backend
  endpoint exists, ask the model team for a few example rows from
  `model_features.csv` (date + total_sales is enough for a first chart
  mockup) rather than waiting on the full pipeline.