"""
reorder_engine.py
-------------------
Takes a demand FORECAST (already produced by the Prophet model in
app/modeling/) and the CURRENT STOCK for an item, and decides how much
to reorder.

This is kept separate from model training/forecasting on purpose:
- modeling/  -> "how much will be used?" (forecasting)
- inference/ -> "what should we do about it?" (business decision)

REORDER RULE:
    reorder_qty = forecasted_demand - current_stock + safety_buffer
    safety_buffer = SAFETY_BUFFER_PCT * forecasted_demand

STATUS RULES:
    - reorder_qty <= 0                          -> "OK — sufficient stock"
    - current_stock < 0.5 * forecasted_demand   -> "URGENT — risk of stockout"
    - otherwise                                 -> "Reorder recommended"
"""

SAFETY_BUFFER_PCT = 0.10  # 10% cushion for unexpected demand spikes


def calculate_reorder(item_name: str, forecasted_demand: float, current_stock: float) -> dict:
    """
    Given a forecasted demand (e.g. sum of Prophet's yhat for the next N
    days) and the current stock on hand, return the reorder decision.
    """
    safety_buffer = SAFETY_BUFFER_PCT * forecasted_demand
    reorder_qty = max(0, forecasted_demand - current_stock + safety_buffer)

    if reorder_qty == 0:
        status = "OK — sufficient stock"
    elif current_stock < forecasted_demand * 0.5:
        status = "URGENT — risk of stockout"
    else:
        status = "Reorder recommended"

    return {
        "item": item_name,
        "forecasted_demand": round(forecasted_demand, 1),
        "current_stock": current_stock,
        "safety_buffer": round(safety_buffer, 1),
        "reorder_qty": round(reorder_qty, 1),
        "status": status,
    }


def calculate_reorder_batch(forecast_dict: dict, stock_dict: dict) -> list:
    """
    Run calculate_reorder() for multiple items at once.

    forecast_dict : {"Milk (litres)": 377.4, "Bread (units)": 641.1, ...}
    stock_dict    : {"Milk (litres)": 420,   "Bread (units)": 180,   ...}
    """
    results = []
    for item, forecasted_demand in forecast_dict.items():
        current_stock = stock_dict.get(item, 0)
        results.append(calculate_reorder(item, forecasted_demand, current_stock))
    return results


# ---- quick manual test (run this file directly to see sample output) ----
if __name__ == "__main__":
    sample_forecast = {
        "Milk (litres)": 377.4,
        "Bread (units)": 641.1,
        "Rice (kg)": 446.7,
        "Flour (kg)": 392.3,
    }
    sample_stock = {
        "Milk (litres)": 420,
        "Bread (units)": 180,
        "Rice (kg)": 900,
        "Flour (kg)": 340,
    }

    for result in calculate_reorder_batch(sample_forecast, sample_stock):
        print(result)
