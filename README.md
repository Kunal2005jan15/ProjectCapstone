# Dine-Shop-AI

A digital menu, ordering & demand-intelligence platform for restaurants —
three services in one repo.

```
Dine-Shop-AI/
├── frontend/                  React + Vite (shop storefront, admin dashboard)
├── food-platform-backend/     Spring Boot 3 + PostgreSQL (core API)
└── ml-service/                FastAPI + Prophet (demand forecasting)
```

## Services

| Service | Stack | Docs |
|---|---|---|
| `frontend/` | React, Vite, Tailwind | `frontend/README.md` |
| `food-platform-backend/` | Spring Boot 3, PostgreSQL, JWT auth | `food-platform-backend/README.md` |
| `ml-service/` | FastAPI, Prophet, Postgres (read) | `ml-service/README.md`, `ml-service/documents/Live_Integration_Guide.md` |

## How they connect

The frontend talks to the Spring Boot backend over its REST API
(JWT-authenticated). The backend owns the Postgres database (orders, shops,
menu items, forecasts, etc.). `ml-service` reads real order history
straight from that same database, trains demand-forecasting models per
shop/item, and pushes the results back into the backend's `forecasts` table
via a machine-authenticated endpoint (see
`ml-service/documents/Live_Integration_Guide.md` for the full data flow and
auth details). The dashboard then reads forecasts out of the database like
any other data — nothing calls the ML model synchronously per order.

## Running locally

Each service has its own setup instructions and `.env.example` — start with
`food-platform-backend/README.md` for the database + backend, then
`frontend/README.md`, then `ml-service/README.md` once you want forecasts
running too.
