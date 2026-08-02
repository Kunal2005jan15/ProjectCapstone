"""
Fetches real historical daily weather for Edinburgh (Bakery dataset's
confirmed location) via Open-Meteo's free historical archive API — no key
required, real observed data, not a forecast or estimate.

Run once: python -m app.notebooks.fetch_bakery_weather
"""

import requests
import pandas as pd

from app.config import BAKERY_LAT, BAKERY_LON, BAKERY_SALES_CSV, WEATHER_BAKERY_CSV

# Match the weather fetch window to the actual dataset's date range —
# check this against what Step 1's column-check cell printed for BAKERY_SALES_CSV
START_DATE = "2016-01-01"
END_DATE = "2017-12-31"


def fetch_and_save():
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": BAKERY_LAT,
        "longitude": BAKERY_LON,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "daily": "temperature_2m_mean,precipitation_sum",
        "timezone": "Europe/London",
    }
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()["daily"]

    df = pd.DataFrame({
        "date": pd.to_datetime(data["time"]),
        "temperature": data["temperature_2m_mean"],
        "precipitation": data["precipitation_sum"],
    })
    df.to_csv(WEATHER_BAKERY_CSV, index=False)
    print(f"saved {len(df)} days of real Edinburgh weather to {WEATHER_BAKERY_CSV}")


if __name__ == "__main__":
    fetch_and_save()