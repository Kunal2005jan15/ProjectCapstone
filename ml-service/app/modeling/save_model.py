"""
STEP 8 — Model Saving (.joblib)

Trains on the FULL history (not just the train split — once evaluation in
step 7 confirms a model performs well, retrain on all available data before
saving) and writes one .joblib per item to models_store/, plus a single
metadata.json recording when/how everything was trained — without this,
there's no way to tell a fresh model from a six-month-old stale one just by
looking at models_store/.

Run directly: python -m app.modeling.save_model
"""

import json
from datetime import datetime, timezone

import joblib

from app.config import MODELS_DIR, SALES_DAILY_PROCESSED_CSV, model_path_for
from app.modeling.train_test_split import load_processed, eligible_items, MIN_HISTORY_DAYS, MIN_AVG_DAILY_QTY
from app.modeling.train_model import train_one

METADATA_PATH = MODELS_DIR / "metadata.json"


def save_all():
    df = load_processed()
    items = eligible_items(df)
    saved_paths = []

    for source, item in items:
        item_df = df[(df["source"] == source) & (df["item_name"] == item)]
        model = train_one(item_df, source)  # full history, no split
        path = model_path_for(source, item)
        joblib.dump(model, path)
        saved_paths.append(path)
        print(f"saved {path}")

    _write_metadata(items)
    return saved_paths


def _write_metadata(items):
    """One metadata.json for the whole batch — per-model metadata files
    would multiply the file count for no real benefit, since all models in
    one save_model.py run share the same training data version and
    thresholds."""
    metadata = {
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_data_file": str(SALES_DAILY_PROCESSED_CSV),
        "min_history_days": MIN_HISTORY_DAYS,
        "min_avg_daily_qty": MIN_AVG_DAILY_QTY,
        "item_count": len(items),
        "items": [f"{source}/{item}" for source, item in items],
    }
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"wrote {METADATA_PATH}")


if __name__ == "__main__":
    paths = save_all()
    print(f"saved {len(paths)} models to models_store/")
