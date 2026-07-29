# 02 — Tech Stack

## Frontend

| Tech | Reason |
|---|---|
| React (Hooks) | Reusable components (MenuCard, CartItem) shared across customer app + dashboard |
| React Router | Multi-page flow (menu → cart → checkout) without full reloads |
| Tailwind CSS | Fast per-shop theme customization via utility classes |
| Axios | Calls Spring Boot APIs, handles JWT headers via interceptors |
| Context / useState | Lightweight cart + auth state without Redux |
| React Query (TanStack Query) | Live order polling, caching, retry logic |
| Recharts | Analytics dashboard (best-sellers, peak hours) |

## Backend (Spring Boot)

| Tech | Reason |
|---|---|
| Java 17 + Spring Boot 3 | Structured REST APIs |
| Spring Security + JWT | Multi-role auth (shop owner / customer / admin) |
| Spring Data JPA + Hibernate | ORM for Postgres |
| PostgreSQL | Relational core + JSONB for flexible theme storage |
| Flyway | Version-controlled DB migrations |
| springdoc-openapi (Swagger UI) | Auto-generated API docs |
| ZXing | QR code generation → `/shop/{shopId}` |
| JUnit5 + Mockito | Unit/integration testing |

## ML / Data Layer (Python)

| Tech | Reason |
|---|---|
| FastAPI | Lightweight, async, containerizable REST service |
| pandas, numpy | EDA and data manipulation |
| scikit-learn | Baseline models |
| Prophet (fallback: moving average) | Sales forecasting |
| matplotlib / seaborn | EDA visualization |
| Uvicorn + Docker | Serving/containerizing |

## DevOps / Infra

| Tech | Reason |
|---|---|
| Docker + Docker Compose | Consistent env across all 3 services |
| GitHub Actions | CI on PRs |
| Render / Railway | Backend + ML hosting |
| Vercel / Netlify | Frontend hosting |
| Neon / Supabase | Managed Postgres |

## Version control & docs

| Tech | Reason |
|---|---|
| Git + GitHub | Feature-branch workflow, PR reviews |
| GitHub Projects | Kanban task tracking |
| Markdown | This docs/ folder |
| Swagger UI | Auto-generated API reference |
| Excalidraw / draw.io | Architecture diagrams |
