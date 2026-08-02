"""
STEP 9 — Load Model
"""

import joblib

from app.config import model_path_for


def load_model(source: str, item_name: str):
    path = model_path_for(source, item_name)
    if not path.exists():
        raise FileNotFoundError(
            f"No trained model found at {path}. Either this item was "
            "filtered out (too little history/volume — see train_test_split.py) "
            "or `save_model.py` hasn't been run since the last data change."
        )
    return joblib.load(path)