# Food Business Digital Platform — Backend

Spring Boot 3 + PostgreSQL backend for the Digital Menu, Ordering & Demand-Intelligence
Platform (B.Tech capstone project). Implements the full schema and business rules from
the project proposal and ER diagram: shop onboarding, menu/theme management, QR-code
generation, no-login QR ordering, real-time inventory deduction with low-stock alerts,
forecast storage (fed by an external Prophet/FastAPI ML service), and rule-based
recommendations (reorder-usual, popularity, trending).

## Tech stack (matches the proposal, section 5.2)

| Layer | Technology |
|---|---|
| Language / runtime | Java 17, Spring Boot 3.3 |
| Web | Spring Web (REST controllers) |
| Security | Spring Security + JWT (jjwt), role-based access (OWNER / CUSTOMER / ADMIN) |
| Persistence | Spring Data JPA + Hibernate, PostgreSQL |
| Migrations | Flyway (`src/main/resources/db/migration`) |
| API docs | springdoc-openapi (Swagger UI) |
| QR codes | ZXing (`core` + `javase`) |
| Boilerplate | Lombok, MapStruct-ready |
| Testing | JUnit 5 + Mockito + AssertJ, H2 for test scope |

## Project layout

```
src/main/java/com/foodplatform/backend/
  config/          SecurityConfig, OpenApiConfig
  security/        JwtService, JwtAuthenticationFilter, AppUserDetails(Service)
  entity/          14 JPA entities matching the ER diagram (+ entity/enums)
  repository/      Spring Data JPA repositories, one per entity
  dto/request/     Request payloads (Java records)
  dto/response/    Response payloads (Java records)
  service/         Business logic (one service per domain area)
  controller/      REST controllers
  exception/       Global exception handling -> consistent JSON error shape
src/main/resources/
  application.yml
  db/migration/V1__init_schema.sql
src/test/java/...  Mockito unit tests for the core business logic
```

## Entities (mirrors the ER diagram exactly)

`USER`, `SHOP`, `SHOP_THEME`, `CATEGORY`, `MENU_ITEM`, `CUSTOMER`, `CUSTOMER_SESSION`,
`QR_CODE`, `ORDER`, `ORDER_ITEM`, `INVENTORY`, `INVENTORY_TRANSACTION`, `FORECAST`,
`RECOMMENDATION`.

## Running locally

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts Postgres 16 on `localhost:5432` with the credentials in `docker-compose.yml`
(matching the defaults in `.env.example`).

### 2. Configure environment

```bash
cp .env.example .env
# edit .env if you changed any DB/JWT values
```

Spring Boot reads these as environment variables (see the `${VAR:default}` placeholders
in `application.yml`). Export them in your shell, or use an IDE run-configuration /
`spring-boot:run` with `-Dspring-boot.run.arguments`, or a tool like `direnv`.

### 3. Run the app

```bash
mvn spring-boot:run
```

Flyway runs automatically on startup and creates the full schema from
`V1__init_schema.sql`. The API is available at `http://localhost:8080`.

### 4. Explore the API

Swagger UI: `http://localhost:8080/swagger-ui.html`
OpenAPI JSON: `http://localhost:8080/v3/api-docs`

### 5. Run tests

```bash
mvn test
```

## Authentication

JWT bearer tokens. Register, then log in to get a token:

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Rao","email":"asha@example.com","password":"SecurePass123","role":"OWNER"}'

curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"SecurePass123"}'
```

Use the returned `accessToken` as `Authorization: Bearer <token>` on subsequent requests.

Roles: `OWNER` (shop owner dashboard), `CUSTOMER` (registered diners), `ADMIN` (shop
approval / platform moderation). Public, no-login endpoints (menu browsing, QR-scan
session start, guest order placement, trending items) require no token, matching the
proposal's frictionless ordering requirement.

## Key API groups

| Area | Base path | Notes |
|---|---|---|
| Auth | `/api/v1/auth` | register, login |
| Shops | `/api/v1/shops` | create/update/approve, theme customization |
| Categories | `/api/v1/shops/{shopId}/categories` | menu categories |
| Menu items | `/api/v1/shops/{shopId}/menu` | CRUD + public browsing |
| QR codes | `/api/v1/shops/{shopId}/qr-codes` | generates a PNG (base64) via ZXing |
| Sessions | `/api/v1/sessions` | no-login session on QR scan |
| Orders | `/api/v1/orders`, `/api/v1/orders/guest` | places order, deducts inventory |
| Inventory | `/api/v1/shops/{shopId}/inventory` | stock, transactions, `/alerts` |
| Forecasts | `/api/v1/shops/{shopId}/forecasts` | ingested from the external ML service |
| Recommendations | `/api/v1/shops/{shopId}/recommendations`, `/trending` | rule-based |

## Business logic notes

- **Ordering deducts inventory in real time.** `OrderService.placeOrder` creates the
  order + order items, then calls `InventoryService.deductForSale` for each line,
  logging a `SALE` `InventoryTransaction` and updating `current_stock`.
- **Low-stock alerts are rule-based** (`current_stock <= reorder_level`), per proposal
  section 8.3. `GET /inventory/alerts` returns the flagged items.
- **Trending items** use a rolling-window `GROUP BY` aggregation (default 7 days), not
  ML — intentionally, per proposal section 8.2.
- **Recommendations** are frequency-based "reorder your usual" for known customers,
  falling back to popularity ranking for new/anonymous customers (cold-start handling
  described in proposal section 8.4).
- **Forecasts** are *stored and served* here, not computed here — Prophet runs in a
  separate FastAPI microservice (proposal section 5.3); that service is expected to
  `POST` results to `/api/v1/shops/{shopId}/forecasts`.

## What's intentionally out of scope for this repo

- The Python/FastAPI + Prophet ML microservice itself (separate service/repo).
- The React frontend.
- Payment gateway integration (payment_status/payment_method are tracked, but no
  gateway webhook handling is wired up).

These are natural next additions once the backend contract above is stable.
