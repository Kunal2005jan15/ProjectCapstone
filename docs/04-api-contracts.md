# 04 — API Contracts

> **Status: draft.** These are the endpoints implied by the feature set and ERD — confirm exact request/response shapes with Backend Lead and ML Lead before building against them, and update this doc (with a `CHANGELOG.md` entry) the moment a contract changes.

## Conventions

- Base URL (backend): `/api/v1`
- Base URL (ML service, called server-to-server by backend, never directly by frontend): `/ml`
- Auth: JWT bearer token for all shop-owner-facing endpoints. Customer-facing endpoints use the anonymous `session_id` instead of a login.
- All timestamps in ISO 8601 UTC.

## Backend (Spring Boot) — Shop Owner facing

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Create owner account |
| POST | `/auth/login` | Returns JWT |
| POST | `/shops` | Create shop, choose template |
| PATCH | `/shops/{shopId}` | Update shop/theme details |
| GET | `/shops/{shopId}/qr` | Generate/fetch QR code |
| POST | `/shops/{shopId}/menu-items` | Add menu item |
| PATCH | `/menu-items/{itemId}` | Edit item |
| DELETE | `/menu-items/{itemId}` | Remove item |
| GET | `/shops/{shopId}/orders?status=` | List orders (polling) |
| PATCH | `/orders/{orderId}/status` | Update order status |
| GET | `/shops/{shopId}/analytics` | Sales trends, best-sellers, peak hours |
| GET | `/shops/{shopId}/forecast` | Predicted demand per item (proxies ML service) |
| GET | `/shops/{shopId}/inventory-alerts` | Low-stock alerts (proxies ML service) |

## Backend (Spring Boot) — Customer facing

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/shops/{shopId}/sessions` | Create anonymous `CustomerSession` on QR scan |
| GET | `/shops/{shopId}/menu` | Categorized menu for browsing |
| POST | `/sessions/{sessionId}/orders` | Place order (includes `<<include>> Data Ingestion` to ML) |
| GET | `/orders/{orderId}/status` | Poll order status |
| GET | `/sessions/{sessionId}/recommendations` | Reorder suggestions (returning) or popular items (new) — proxies ML service |

## ML Service (FastAPI) — called by backend only

| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/ml/forecast` | `{ item_id, shop_id, horizon_days }` | `{ predicted_demand, lower_bound, upper_bound }` per day |
| GET | `/ml/trending?shop_id=` | — | ranked list of top-N items, rolling 7-day window |
| POST | `/ml/recommend` | `{ session_id, shop_id }` | ranked item list + `reason` (reorder / popular / co_occurrence) |
| GET | `/ml/inventory-alerts?shop_id=` | — | items where `forecasted_demand > current_stock` |
| POST | `/ml/ingest` | order payload (see `05-ml-datasets.md`) | `{ status: "ok" }` — async data ingestion for training |

## Cross-service dependency to flag

`OrderService` (backend) calls `/ml/forecast` and `/ml/inventory-alerts` — both depend on the `Forecast` and `Inventory` tables existing with the fields in `03-erd-schema.md`. `/ml/recommend` depends on `session_id` from `CustomerSession`. Don't build the ML side ahead of backend confirming these fields are final.
