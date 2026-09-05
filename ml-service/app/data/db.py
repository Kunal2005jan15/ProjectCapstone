"""
Live database connection to the Dine-Shop-AI Postgres instance (hosted on
Render).

This is ADDITIVE — it does not touch the existing CSV-based demo pipeline
(app/config.py's SALES_DAILY_PROCESSED_CSV, app/modeling/train_model.py,
app/inference/predict.py). Those keep working exactly as before, reading
the pizza/bakery Kaggle demo data. This module is a second, parallel data
source used only by the new "live" endpoints/scripts (see
app/data/live_sales.py, app/inference/live_predict.py).

Configuration (env vars, see .env.example):
    DATABASE_URL   Full Postgres connection string, e.g. from Render:
                    postgresql://user:password@host:5432/dbname
                    Render's internal/external URLs both work; if you use
                    the external one, Render requires SSL — see below.

Render specifics:
    - Render's managed Postgres requires SSL for external connections.
    - If DATABASE_URL doesn't already include `sslmode=require`, we add it
      automatically (see _ensure_sslmode below) so this works out of the box
      with a Render "External Database URL" pasted in as-is.
    - If you're using Render's *Internal* Database URL (service-to-service,
      same Render network) SSL isn't required, and we leave the string alone
      in that case since Render internal URLs don't need sslmode.
"""

from __future__ import annotations

import os
from functools import lru_cache
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine


def _ensure_sslmode(url: str) -> str:
    """Render's external Postgres URLs need sslmode=require. Internal URLs
    (hostname ending in the Render-internal ".render.com" private network,
    or already containing sslmode) are left untouched."""
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    if "sslmode" in query:
        return url
    query["sslmode"] = ["require"]
    new_query = urlencode(query, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    raw_url = os.environ.get("DATABASE_URL")
    if not raw_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy .env.example to .env and paste "
            "in the Render Postgres connection string (Dashboard -> your "
            "Postgres instance -> Connections -> External Database URL)."
        )

    # SQLAlchemy wants "postgresql://", Render sometimes gives "postgres://"
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    url = _ensure_sslmode(raw_url)

    # pool_pre_ping avoids using a stale/dropped connection after Render's
    # free-tier databases idle out or restart.
    return create_engine(url, pool_pre_ping=True, pool_recycle=1800)


def check_connection() -> bool:
    """Quick health check — used by /health/db and safe to call at startup."""
    from sqlalchemy import text
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"[db] connection check failed: {e}")
        return False
