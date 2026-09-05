"""
Maps our demo (source, item_name) identifiers to the backend's real
(shop_id, item_id) UUIDs.

WHY THIS EXISTS: our pipeline currently trains on "bakery"/"pizza" demo
data (see Findings & Results report, §3). The backend's forecasts table is
keyed by real UUIDs from its own menu_items/shops tables. Something has to
bridge the two. This file is that bridge — a simple JSON lookup, not a
database join, because the ML side should not need write access to the
backend's schema just to know which UUID an item corresponds to.

HOW THIS GETS POPULATED (once a real shop exists):
  1. Backend creates a shop + menu items as normal (shop owner onboarding).
  2. Someone (either side) runs a one-time export: for each menu_item row,
     record (shop_id, item_id, item_name).
  3. That gets saved to item_mapping.json in the shape below.
  4. From then on, push_forecasts.py can look up the right UUIDs by name.
"""

import json

from app.config import ITEM_MAPPING_PATH


def load_item_mapping() -> dict:
    """Returns {(source, item_name): {"shop_id": ..., "item_id": ...}}."""
    if not ITEM_MAPPING_PATH.exists():
        raise FileNotFoundError(
            f"{ITEM_MAPPING_PATH} does not exist yet. This is expected until "
            "a real shop exists in the backend — see the docstring in this "
            "file for how to populate it. Copy item_mapping.example.json to "
            "item_mapping.json and fill in real UUIDs to proceed."
        )

    with open(ITEM_MAPPING_PATH) as f:
        raw = json.load(f)

    if not raw:
        raise ValueError(
            f"{ITEM_MAPPING_PATH} exists but is empty — nothing has been "
            "mapped yet. Nothing can be pushed to the backend until at "
            "least one item is mapped."
        )

    mapping = {}
    for entry in raw:
        key = (entry["source"], entry["item_name"])
        mapping[key] = {"shop_id": entry["shop_id"], "item_id": entry["item_id"]}
    return mapping


def get_backend_ids(source: str, item_name: str, mapping: dict | None = None):
    """Returns (shop_id, item_id) for a given demo item, or None if unmapped."""
    if mapping is None:
        mapping = load_item_mapping()
    entry = mapping.get((source, item_name))
    if entry is None:
        return None
    return entry["shop_id"], entry["item_id"]