# 03 — ERD / Schema

> **Status: draft, pending Backend Lead sign-off.** The entities and priority order below (Shop, User, Category, MenuItem, Customer, CustomerSession, Order, OrderItem, Inventory, Forecast first; ShopTheme, QRCode, Recommendation, InventoryTransaction later) match what was referenced in your Backend Lead's original ERD doc — but that doc's full attribute list wasn't in what I had to work from, so the attributes below are a reasonable reconstruction based on the feature set in `01-vision.md`, not a transcription of their file. **Do not let ML build against this until Backend Lead has confirmed or corrected it against their actual document** — especially the `CustomerSession` entity, since `/recommend` depends on `session_id` existing in the real schema.

## Priority order (build in this sequence)

**Phase 1 (Week 1–2):** Shop → User → Category → MenuItem → Customer → CustomerSession → Order → OrderItem → Inventory → Forecast
**Phase 2 (later):** ShopTheme → QRCode → Recommendation → InventoryTransaction

## Entities

### Shop
| Field | Type | Notes |
|---|---|---|
| shop_id | UUID (PK) | |
| name | varchar | |
| owner_user_id | UUID (FK → User) | |
| slug | varchar, unique | used in `/shop/:slug` |
| address | varchar | |
| gst_number | varchar, nullable | |
| plan_tier | enum(free, paid) | |
| created_at | timestamp | |

### User
| Field | Type | Notes |
|---|---|---|
| user_id | UUID (PK) | |
| email | varchar, unique | |
| password_hash | varchar | |
| role | enum(owner, admin) | |
| created_at | timestamp | |

### ShopTheme (Phase 2)
| Field | Type | Notes |
|---|---|---|
| theme_id | UUID (PK) | |
| shop_id | UUID (FK → Shop) | |
| logo_url | varchar | |
| banner_url | varchar | |
| primary_color | varchar | |
| layout_template | varchar | |

### Category
| Field | Type | Notes |
|---|---|---|
| category_id | UUID (PK) | |
| shop_id | UUID (FK → Shop) | |
| name | varchar | e.g. "Beverages", "Mains" |
| sort_order | int | |

### MenuItem
| Field | Type | Notes |
|---|---|---|
| item_id | UUID (PK) | |
| shop_id | UUID (FK → Shop) | |
| category_id | UUID (FK → Category) | |
| name | varchar | |
| description | text, nullable | |
| price | decimal | |
| image_url | varchar, nullable | |
| is_available | boolean | |

### Customer
| Field | Type | Notes |
|---|---|---|
| customer_id | UUID (PK) | |
| phone_number | varchar, nullable | used to identify returning customers |
| created_at | timestamp | |

### CustomerSession
| Field | Type | Notes |
|---|---|---|
| session_id | UUID (PK) | anonymous session token issued on QR scan |
| shop_id | UUID (FK → Shop) | |
| customer_id | UUID (FK → Customer), nullable | populated only if phone captured |
| created_at | timestamp | |
| expires_at | timestamp | |

*Handles no-login QR ordering: a session exists before any customer identity is known, and can later link to a `Customer` if a phone number is captured at checkout.*

### Order
| Field | Type | Notes |
|---|---|---|
| order_id | UUID (PK) | |
| shop_id | UUID (FK → Shop) | |
| session_id | UUID (FK → CustomerSession) | |
| status | enum(received, preparing, ready, completed) | |
| total_amount | decimal | |
| created_at | timestamp | |

### OrderItem
| Field | Type | Notes |
|---|---|---|
| order_item_id | UUID (PK) | |
| order_id | UUID (FK → Order) | |
| item_id | UUID (FK → MenuItem) | |
| quantity | int | |
| unit_price | decimal | price at time of order |

### Inventory
| Field | Type | Notes |
|---|---|---|
| inventory_id | UUID (PK) | |
| item_id | UUID (FK → MenuItem) | |
| current_stock | decimal | |
| unit | varchar | e.g. "kg", "units" |
| low_stock_threshold | decimal | |
| updated_at | timestamp | |

### InventoryTransaction (Phase 2)
| Field | Type | Notes |
|---|---|---|
| transaction_id | UUID (PK) | |
| inventory_id | UUID (FK → Inventory) | |
| change_amount | decimal | positive (restock) or negative (consumption) |
| reason | enum(order, restock, waste, correction) | |
| created_at | timestamp | |

### Forecast
| Field | Type | Notes |
|---|---|---|
| forecast_id | UUID (PK) | |
| item_id | UUID (FK → MenuItem) | |
| forecast_date | date | |
| predicted_demand | decimal | |
| lower_bound | decimal | Prophet uncertainty interval |
| upper_bound | decimal | Prophet uncertainty interval |
| generated_at | timestamp | |

### Recommendation (Phase 2)
| Field | Type | Notes |
|---|---|---|
| recommendation_id | UUID (PK) | |
| session_id | UUID (FK → CustomerSession) | |
| item_id | UUID (FK → MenuItem) | |
| reason | enum(reorder, popular, co_occurrence) | |
| rank | int | |

### QRCode (Phase 2)
| Field | Type | Notes |
|---|---|---|
| qr_id | UUID (PK) | |
| shop_id | UUID (FK → Shop) | |
| target_url | varchar | points to `/shop/{shopId}` |
| generated_at | timestamp | |

## Relationships

- Shop 1—N MenuItem, Category, Order, QRCode, ShopTheme (1—1)
- User 1—N Shop (an owner can run more than one shop)
- Category 1—N MenuItem
- CustomerSession N—1 Shop, N—1 Customer (nullable)
- Order N—1 CustomerSession, 1—N OrderItem
- OrderItem N—1 MenuItem
- Inventory 1—1 MenuItem, 1—N InventoryTransaction
- Forecast N—1 MenuItem
- Recommendation N—1 CustomerSession, N—1 MenuItem

## Open question for Backend Lead

Confirm `CustomerSession` is being built as specified (anonymous-first, optionally linked to `Customer`) before ML Dev 2 builds `/recommend` against `session_id`. Log any change to this doc in `CHANGELOG.md`.
