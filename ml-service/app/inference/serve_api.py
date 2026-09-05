"""
STEP 12 — Send Prediction to Frontend

Run: uvicorn app.inference.serve_api:app --reload

Two families of endpoints live here side by side:
  /forecast, /health           the original demo pipeline (pizza/bakery CSV
                                data, source+item_name keys) — UNCHANGED.
  /forecast/live, /health/db   the new live pipeline, reading real orders
                                out of Postgres and keyed by real
                                shop_id/item_id. Additive only.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.exc import OperationalError
import os

from app.inference.predict import predict_next_n_days
from app.inference.live_predict import predict_live
from app.data.db import check_connection

app = FastAPI(title="ml-service — Sales Forecasting")

# The admin dashboard's "Demand Forecast" test page calls /forecast/live
# directly from the browser (not proxied through the Spring Boot backend),
# so this needs its own CORS config — separate from, and in addition to,
# the backend's CORS_ALLOWED_ORIGINS.
# Comma-separated list, e.g. "http://localhost:5173,https://your-app.vercel.app"
# Defaults to "*" (open) so local dev works out of the box; set this
# explicitly in production.
_cors_origins_env = os.environ.get("ML_CORS_ALLOWED_ORIGINS", "*")
_cors_origins = ["*"] if _cors_origins_env.strip() == "*" else [
    o.strip() for o in _cors_origins_env.split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ForecastRequest(BaseModel):
    source: str        # "pizza" or "bakery"
    item_name: str      # e.g. "Coffee" — must match sales_daily.csv exactly, case-sensitive
    n_days: int = 7


class LiveForecastRequest(BaseModel):
    shop_id: str
    item_id: str
    n_days: int = 7


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    ok = check_connection()
    if not ok:
        raise HTTPException(status_code=503, detail="Database connection failed")
    return {"status": "ok"}


@app.post("/forecast")
def forecast(req: ForecastRequest):
    try:
        result = predict_next_n_days(req.source, req.item_name, req.n_days)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result.to_dict(orient="records")


@app.post("/forecast/live")
def forecast_live(req: LiveForecastRequest):
    """Forecasts a real menu item using live order history from Postgres.
    Trains and caches a Prophet model on the spot the first time an item
    qualifies for it; otherwise reuses whatever the nightly job (or a
    previous call) already trained."""
    try:
        result = predict_live(req.shop_id, req.item_id, req.n_days)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        # DATABASE_URL missing/misconfigured — same shape of failure as
        # /health/db, so callers can distinguish "no data for this item"
        # (404 above) from "can't reach the database at all" (503).
        raise HTTPException(status_code=503, detail=str(e))
    except OperationalError as e:
        raise HTTPException(status_code=503, detail=f"Database unreachable: {e}")
    return result.to_dict(orient="records")