# 05 — ML Datasets

> **Status: draft.** Section 18 of the Backend Lead's original ERD doc apparently specifies these 5 files exactly — that section wasn't in what I had to work from, so the column lists below are a reasonable reconstruction based on the forecasting/recommendation/inventory features in `01-vision.md` and the entities in `03-erd-schema.md`. **Confirm against the original before ML Dev 1 starts building generators against this** — this is the contract, so a mismatch here is exactly the "quantity_sold vs qty_sold" failure mode `CHANGELOG.md` exists to catch.

Real datasets (Coffee Shop Sales, Rossmann, Store Item Demand, Online Retail, Instacart, Zomato — see project proposal §6) are used to validate methodology and seed realistic patterns (weekday/weekend spikes, meal-time peaks, seasonality). Synthetic data matching the schemas below is generated to demo the live system end-to-end, since new shops have no history (the cold-start problem).

## A. `sales_daily.csv` — for sales forecasting (Prophet)

| Column | Type | Notes |
|---|---|---|
| shop_id | UUID | |
| item_id | UUID | |
| date | date | one row per item per day |
| quantity_sold | int | |
| revenue | decimal | |
| day_of_week | int | 0–6, derivable but kept for convenience |
| is_holiday | boolean | |

## B. `customer_item_history.csv` — for "reorder your usual"

| Column | Type | Notes |
|---|---|---|
| customer_id | UUID | nullable if anonymous session only |
| session_id | UUID | |
| item_id | UUID | |
| order_id | UUID | |
| order_timestamp | datetime | |
| quantity | int | |

## C. `item_cooccurrence.csv` — for stretch-goal "also ordered" recommendations

| Column | Type | Notes |
|---|---|---|
| shop_id | UUID | |
| item_id_a | UUID | |
| item_id_b | UUID | |
| co_occurrence_count | int | number of orders containing both items |

## D. `inventory_data.csv` — for low-stock alert threshold logic

| Column | Type | Notes |
|---|---|---|
| item_id | UUID | |
| current_stock | decimal | |
| unit | varchar | |
| avg_daily_consumption | decimal | rolling average, used for safety-stock buffer |
| low_stock_threshold | decimal | |
| last_restocked_at | datetime | |

## E. `shop_metadata.csv` — for EDA / demand-driver context

| Column | Type | Notes |
|---|---|---|
| shop_id | UUID | |
| city | varchar | |
| cuisine_type | varchar | |
| seating_capacity | int | |
| avg_cost_for_two | decimal | benchmarking field, inspired by Zomato dataset |
| opened_date | date | |

## Notes for ML Dev 1 / ML Dev 2

- Every generator script should document, in its own header comment, which real dataset's patterns it's sampling from (per project proposal §6.2), so the report's "cold-start" framing stays accurate.
- Any column added, renamed, or dropped here needs a same-day entry in `CHANGELOG.md` — Backend's `Order`/`OrderItem`/`Inventory` tables are the source of truth this file is meant to mirror.
