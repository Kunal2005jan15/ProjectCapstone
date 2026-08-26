# Dineflow Inventory — Demand Forecasting (Prophet)

ML-based demand forecasting and reorder system for restaurant/cloud kitchen inventory (Milk, Bread, Rice, Flour, etc.), built using Facebook Prophet.

## Why this project?

Cloud/restaurant kitchens either over-order (wastage) or under-order (stockouts) raw inventory. This module forecasts daily demand per item and converts it into an actionable reorder decision.

## Folder Structure

- `app/data/` — synthetic data generation scripts + datasets
- `app/modeling/` — Prophet model training and forecasting
- `app/inference/` — reorder logic (forecast → order decision)
- `reports/` — output plots and result summaries

## How it works

1. **Data**: Daily usage data per item (`ds` = date, `y` = quantity used)
2. **Model**: Prophet auto-learns trend, weekly seasonality (e.g. weekend spikes), and yearly seasonality (festive season) per item
3. **Forecast**: Predicts demand for the next 7 days per item
4. **Reorder Rule**:
