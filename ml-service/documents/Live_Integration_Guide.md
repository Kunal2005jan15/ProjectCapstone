# Live Integration Guide — real shop data, merged into Dine-Shop-AI

This describes the pipeline that replaced the open questions in
`Backend_Integration_Guide.md` Section 4. As of this merge, `ml-service/` is
no longer a separate repo — it lives at `Dine-Shop-AI/ml-service/`, a sibling
of `frontend/` and `food-platform-backend/`, and reads directly from the
same Postgres database the backend uses (Render).

```
Dine-Shop-AI/
├── frontend/                  React + Vite
├── food-platform-backend/     Spring Boot
└── ml-service/                FastAPI + Prophet  <-- this
```

## What was decided (Section 6 of the original guide, now answered)

1. **Data access: shared DB read access**, not an export endpoint. Simpler,
   and the two services already sit in the same monorepo/deployment.
2. **Real identifiers**: `shop_id` / `item_id` (UUIDs, matching the
   backend's schema exactly) — not `source` / `item_name`.
3. **Retraining cadence: nightly**, via `app/modeling/train_live_models.py`.
   Not per-order, not per-request.

## The new endpoint

**`POST /forecast/live`**

```json
{ "shop_id": "uuid", "item_id": "uuid", "n_days": 7 }
```

Same response shape as the demo `/forecast` (`predicted_demand`,
`lower_bound`, `upper_bound`, `method`), same three-tier fallback
(`prophet` / `moving_average_fallback` / `popularity_fallback`) — see
Section 2 of `Backend_Integration_Guide.md`, all of that still applies
unchanged. The only difference is what you send in.

**`GET /health/db`** — separate from `/health`; confirms the *database*
connection specifically, not just that the process is up.

## How data actually flows

```
orders / order_items / menu_items (Postgres)
        ↓  app/data/live_sales.py (reads directly, excludes CANCELLED orders)
app/inference/live_predict.py (tier classification + Prophet)
        ↓
models_store_live/*.joblib (cached per shop+item — trained once, reused)
        ↓
app/integration/push_live_forecasts.py (nightly job)
        ↓
POST /api/v1/shops/{shopId}/forecasts  (Spring Boot backend)
        ↓
forecasts table  →  dashboard reads from here
```

Nothing calls the ML model synchronously when a customer places an order.
Training and pushing happen on a schedule; `/forecast/live` also works
on-demand (training on the spot the first time an item qualifies for
Prophet), but the normal path is nightly batch → stored forecasts → read
from the DB.

## Auth: how the ML service is allowed to push forecasts

`POST /api/v1/shops/{shopId}/forecasts` normally requires an OWNER/ADMIN
JWT. The ML service isn't a logged-in user, so it authenticates instead with
a shared secret sent as a dedicated header:

```
X-ML-Service-Key: <value of ML_PUSH_API_KEY>
```

Deliberately **not** `Authorization: Bearer` — that header is reserved for
real user JWTs (`JwtAuthenticationFilter`), and this stays fully separate so
it can never interfere with normal login/session behavior. See
`food-platform-backend/.../security/MlServiceApiKeyFilter.java`.

This is opt-in: if `ML_PUSH_API_KEY` isn't set on the backend, that endpoint
simply stays OWNER/ADMIN-only, exactly as it was before this integration.

## Configuration needed to actually run this

**`ml-service/.env`** (copy from `.env.example`):
```
DATABASE_URL=<Render Postgres connection string>
BACKEND_BASE_URL=<Spring Boot backend URL>
ML_PUSH_AUTH_TOKEN=<a random secret — must match ML_PUSH_API_KEY below>
```

**`food-platform-backend/.env`** (add to existing):
```
ML_PUSH_API_KEY=<same random secret as ML_PUSH_AUTH_TOKEN above>
```

## What's been tested vs. what's still pending

**Tested end-to-end** against a local Postgres instance running the exact
production schema (`V1__init_schema.sql`): seeded 90 days of real-shaped
order data plus a cancelled order and a zero-history item, then verified —
- `live_sales.py`'s query correctly excludes cancelled orders
- the Prophet tier trains and predicts correctly on 90 days of history
- the popularity-fallback tier correctly handles the zero-history item
- `/forecast/live` returns the right shape and the right HTTP status
  (200 on success, 404 for genuinely no data, 503 if the DB is unreachable
  — this last one didn't exist originally and was added after testing
  surfaced it as an unhandled 500)
- the nightly job trains only items that actually qualify, skipping the rest
- the push script's dry-run output matches the backend's `ForecastRequest`
  field-for-field

**Not yet tested**: against your actual Render database, and the backend
filter itself (`MlServiceApiKeyFilter`) hasn't been exercised with a live
Spring Boot process — Maven Central wasn't reachable in the sandbox this was
built in, so that side was verified by careful manual review rather than a
live test run. Recommend a real end-to-end smoke test (nightly job → real
push → confirm rows land in `forecasts`) before relying on this in
production.
