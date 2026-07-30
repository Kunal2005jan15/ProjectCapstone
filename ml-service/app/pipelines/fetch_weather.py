from pathlib import Path
import requests
import pandas as pd

LAT = 28.6139
LON = 77.2090

START = "20150101"
END = "20151231"

OUTPUT = Path("app/data/external/weather/weather_india.csv")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

parameters = [
    "T2M",
    "T2M_MAX",
    "T2M_MIN",
    "PRECTOTCORR",
    "RH2M",
    "WS2M",
]

url = (
    "https://power.larc.nasa.gov/api/temporal/daily/point?"
    f"parameters={','.join(parameters)}"
    f"&community=AG"
    f"&longitude={LON}"
    f"&latitude={LAT}"
    f"&start={START}"
    f"&end={END}"
    "&format=JSON"
)

print("Downloading weather data...")

response = requests.get(url, timeout=60)

response.raise_for_status()

data = response.json()

daily = data["properties"]["parameter"]

dates = sorted(daily["T2M"].keys())

records = []

for d in dates:

    records.append(
        {
            "date": d,
            "temperature": daily["T2M"][d],
            "max_temperature": daily["T2M_MAX"][d],
            "min_temperature": daily["T2M_MIN"][d],
            "rainfall": daily["PRECTOTCORR"][d],
            "humidity": daily["RH2M"][d],
            "wind_speed": daily["WS2M"][d],
        }
    )

weather = pd.DataFrame(records)

weather["date"] = pd.to_datetime(weather["date"])

weather.to_csv(OUTPUT, index=False)

print(weather.head())

print()

print(f"Saved to {OUTPUT}")

print(f"Rows: {len(weather)}")