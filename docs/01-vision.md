# 01 — Vision

## Problem

Small and medium-scale food businesses in India (cafes, restaurants) lack an affordable, easy-to-use digital presence. Existing options are:

- **Too expensive/complex** — enterprise POS or website-builder platforms built for large chains, requiring technical staff the shop doesn't have.
- **Too generic** — aggregators (Zomato/Swiggy) charge high commissions (18–30%), own the customer relationship, and don't build the shop's own brand.
- **Manually inefficient** — paper menus, verbal orders, gut-feeling inventory decisions → waste, stockouts, missed sales.

This creates two compounding gaps: no low-cost self-service ordering experience, and no data-driven visibility into what's selling, what to stock, or how to serve customers better.

## Sub-problems

1. **Accessibility** — shop owners with low technical literacy need a way to build a digital menu/page without a developer.
2. **Ordering friction** — customers have no fast, contactless way to browse and order without waiting for staff.
3. **Demand visibility** — owners don't know in advance how much of an item they'll sell, causing over- or under-preparation.
4. **Inventory inefficiency** — no demand signal means guesswork stock ordering → spoilage or emergency restocking.
5. **Personalization gap** — every customer sees the same static menu; no distinction between first-time visitor and regular.

## Solution

A web platform where a shop owner signs up, builds a menu/theme page in minutes, and gets a QR code for tables/counter. Customers scan → land on the shop's page → browse → order, no app download, no login. A data/ML layer analyzes order patterns to reduce waste and increase sales via forecasting, trending insights, and lightweight personalization.

| Sub-problem | How the platform addresses it |
|---|---|
| Accessibility | Template-based page builder — no coding needed |
| Ordering friction | QR-triggered, no-login ordering flow (browse → cart → order → notify counter) |
| Demand visibility | Sales forecasting model (Prophet) per item |
| Inventory inefficiency | Rule-based low-stock alerts tied to forecasted demand |
| Personalization gap | "Reorder your usual" for regulars, popularity-based for new customers |
| Trending visibility | Rolling-window "trending items" dashboard |

## Target users

**Primary — Shop owners (B2B):** medium-scale cafes/restaurants, 15–40 seats, low-to-moderate technical literacy, cost-sensitive, currently on free tools or a single aggregator listing.

**Secondary — End customers (B2C):** walk-in diners who want a fast, no-hassle way to browse and order, expecting a WhatsApp/Swiggy-level experience even at a small cafe.

## Business model

Freemium SaaS.
- **Free tier:** digital page + QR menu + basic ordering, capped at a limited number of monthly orders or one theme.
- **Paid tier (₹300–₹800/month):** full customization, forecasting/inventory dashboard, recommendation engine, multiple themes, priority support.

## Competitive positioning

| Dimension | Aggregators | Established QR/POS platforms | Our platform |
|---|---|---|---|
| Target scale | Any size | Small to enterprise chains | Single-outlet, medium-scale |
| Setup complexity | Low | Moderate | Very low — no-code, <10 min |
| Commission | High (18–30%) | Subscription, low/no commission | Low/no commission, flat fee |
| Insights | Owned by aggregator | Marketed as "AI," rarely explained | Transparent, explainable |
| Customer relationship | Owned by platform | Owned by shop | Owned by shop |

See the full project proposal for detailed reasoning behind each of these choices.
