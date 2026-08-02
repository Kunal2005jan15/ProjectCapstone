"""
STEP 12 — Send Prediction to Frontend

Run: uvicorn app.inference.serve_api:app --reload
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.inference.predict import predict_next_n_days

app = FastAPI(title="ml-service — Sales Forecasting")


class ForecastRequest(BaseModel):
    source: str        # "pizza" or "bakery"
    item_name: str      # e.g. "Coffee" — must match sales_daily.csv exactly, case-sensitive
    n_days: int = 7


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/forecast")
def forecast(req: ForecastRequest):
    try:
        result = predict_next_n_days(req.source, req.item_name, req.n_days)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result.to_dict(orient="records")