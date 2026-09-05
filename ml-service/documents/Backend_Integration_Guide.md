# ML Service — Backend Integration Guide

> **Status: the cold-start questions in Section 4 below are now resolved and
> built.** This document describes the original demo pipeline (`/forecast`,
> keyed by `source`/`item_name`, Kaggle pizza/bakery data) — still accurate
> and still working. For the live pipeline that actually reads real shop
> data out of Postgres (`/forecast/live`, keyed by real `shop_id`/`item_id`),
> see **[Live_Integration_Guide.md](./Live_Integration_Guide.md)**.

Plain-language version: what the backend team needs to **send** to the ML service, what it **gets back**, and what it needs to **build** to support cold-start.

---

## 1. What the ML service is

A separate FastAPI service (`ml-service/`) that answers one question: *"how much of item X will shop Y sell over the next N days?"* The Spring Boot backend calls it over HTTP — it doesn't share a database connection or run in the same process.

```
Shop Owner Browser → Spring Boot Backend → ML Service (FastAPI) → response
                              ↓
                         PostgreSQL (orders, shops, menu items)
```

## 2. The one endpoint that matters right now

**`POST /forecast`**

### What the backend sends:

```json
{
  "source": "bakery",
  "item_name": "Coffee",
  "n_days": 7
}
```

- `source` — currently `"bakery"` or `"pizza"` (the two demo datasets). **This will change to `shop_id` once real shops are live** — see Section 4.
- `item_name` — must match the item's name **exactly**, case-sensitive, as it exists in the training data.
- `n_days` — how many days ahead to forecast (default 7).

### What comes back:

```json
[
  {
    "date": "2017-12-04T00:00:00",
    "predicted_demand": 12.22,
    "lower_bound": 0.0,
    "upper_bound": 28.90,
    "method": "prophet"
  },
  ...
]
```

- `predicted_demand` — the number to show the shop owner ("expect ~12 units tomorrow").
- `lower_bound` / `upper_bound` — a confidence range. **Show this range, not just the single number** — it's what the Project Proposal already promises ("expect 40-60 orders of X tomorrow" rather than false precision).
- `method` — tells you **how confident to present this as**. Three possible values:
  - `"prophet"` — a real trained model, enough history to trust.
  - `"moving_average_fallback"` — not enough history/volume for a real model; this is a simple recent-average estimate. **Label this differently in the UI** (e.g. "early estimate" badge) — don't show it with the same visual confidence as a Prophet forecast.
  - `"popularity_fallback"` — coming with cold-start (Section 4); zero history at all, generic popularity ranking used instead.

### Error case:

If the item has literally zero sales history (not even enough for a moving average), you'll get an HTTP `404` with a `detail` message explaining why. Handle this gracefully in the UI — don't show a raw error to the shop owner, show "not enough data yet."

## 3. Health check

**`GET /health`** → `{"status": "ok"}` — use this for your own service monitoring / uptime checks before routing real traffic to `/forecast`.

## 4. What the backend needs to build for cold-start (real shops, not demo data)

Right now the ML service only knows about two demo "shops" (`pizza`, `bakery`). For real shop data to flow through:

### 4.1 Backend responsibilities

1. **Send order data somewhere the ML service can read it.** Two options — pick one with the ML lead:
   - **Shared database read access** — ML service reads directly from the `orders`/`order_items` tables (simplest, but couples the two services to the same schema).
   - **Export endpoint** — backend exposes an internal endpoint the ML service polls/pulls from periodically (cleaner separation, more setup work).
2. **Trigger retraining on a schedule**, not on every order — e.g. a nightly job that re-runs Steps 5-8 (train/test split → save model) for every shop with new data. This does **not** need to be synchronous with order placement.
3. **Pass `shop_id` and `item_id` instead of `source`/`item_name`** once real shops exist — the request/response contract stays the same shape, just the identifiers change. Confirm with the ML side before changing field names so both sides update together.

### 4.2 What "cold-start tiers" mean for the UI

Every new shop starts with **zero data**, and the forecast quality genuinely differs by how much history has accumulated — this isn't a bug to hide, it's expected and already designed for:

| Shop's data volume | What `/forecast` returns | How to show it |
|---|---|---|
| Enough history + volume (≥60 days, ≥0.5 avg/day) | `method: "prophet"` | Full forecast + confidence range, presented normally |
| Some history, not enough | `method: "moving_average_fallback"` | Same UI, but a small "early estimate — improves with more data" note |
| Brand new item, zero history | `method: "popularity_fallback"` (coming) | "Based on similar shops" or "Popular item" framing, not a personalized forecast |

This directly matches what the SRS already promises (§6, Reliability: *"forecasts should degrade gracefully... rather than fail outright when data is sparse"*) — so this isn't new scope, it's fulfilling an existing requirement.

## 5. Things NOT to build into the request (and why)

- **No weather field.** Tested and found not to meaningfully help (see the Findings report, §8) — don't add UI or API surface for a feature that was deliberately excluded.
- **No manual date range for training** — retraining is a scheduled backend/ops job (Section 4.1), not something triggered per-request.

## 6. Suggested next sync with the ML side

Before backend work starts on the real integration, confirm together:
1. Which of the two data-access options in 4.1 (shared DB vs. export endpoint) the team is going with.
2. The exact `shop_id`/`item_id` field names and types, so both sides build to the same contract from day one.
3. Retraining cadence (nightly? weekly? per-shop threshold-triggered?).
