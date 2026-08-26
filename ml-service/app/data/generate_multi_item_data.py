"""
Step 1: Synthetic multi-item ORDERS data for a cloud/restaurant kitchen.
We simulate 2 years of daily consumption for 4 raw inventory items, each
with its OWN realistic pattern:

- Milk   : used daily, fairly steady, slight weekend bump (more breakfast orders)
- Bread  : used daily, strong weekend bump (more sandwiches/burgers on Fri-Sun)
- Rice   : used daily, steady with festive-season (Oct-Dec) spike (biryani etc.)
- Flour  : used daily but in a "bulk usage" pattern - bigger swings, since it's
           used for multiple items (bread, roti, pizza base) - higher variance

This mimics what a real POS/kitchen-management export would look like once
grouped by date and item.
"""
import numpy as np
import pandas as pd

np.random.seed(7)

start_date = "2024-01-01"
end_date = "2025-12-31"
dates = pd.date_range(start=start_date, end=end_date, freq="D")
n = len(dates)
t = np.arange(n)
dow = dates.dayofweek          # Mon=0 ... Sun=6
doy = dates.dayofyear

def make_series(base, trend_slope, weekend_boost, festive_amp, noise_sd, min_val):
    trend = base + trend_slope * t
    weekly = np.where(dow >= 4, weekend_boost, 0)  # Fri/Sat/Sun boost
    yearly = festive_amp * np.sin(2 * np.pi * (doy - 270) / 365)  # peak ~Oct-Dec
    noise = np.random.normal(0, noise_sd, n)
    y = trend + weekly + yearly + noise
    return np.clip(y, min_val, None)

items = {
    "Milk (litres)":  make_series(base=40, trend_slope=0.01, weekend_boost=8,  festive_amp=4,  noise_sd=3,  min_val=15),
    "Bread (units)":  make_series(base=60, trend_slope=0.015,weekend_boost=25, festive_amp=6,  noise_sd=5,  min_val=15),
    "Rice (kg)":      make_series(base=35, trend_slope=0.02, weekend_boost=6,  festive_amp=12, noise_sd=4,  min_val=10),
    "Flour (kg)":     make_series(base=30, trend_slope=0.02, weekend_boost=10, festive_amp=8,  noise_sd=6,  min_val=8),
}

rows = []
for item_name, values in items.items():
    for d, v in zip(dates, values):
        rows.append({"date": d, "item": item_name, "quantity_used": round(v, 1)})

orders_df = pd.DataFrame(rows)
orders_df.to_csv("/home/claude/resume/dineflow_multi_item_orders.csv", index=False)

print(orders_df.head(8))
print("\nTotal rows:", len(orders_df))
print("Items:", orders_df["item"].unique().tolist())
print("Date range:", orders_df.date.min(), "to", orders_df.date.max())
