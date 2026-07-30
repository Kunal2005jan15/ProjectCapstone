from pathlib import Path
import pandas as pd
import holidays

INPUT = Path("app/data/external/weather/weather_india.csv")
OUTPUT = Path("app/data/external/holidays/holidays_india.csv")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

weather = pd.read_csv(INPUT)

weather["date"] = pd.to_datetime(weather["date"])

years = sorted(weather["date"].dt.year.unique())

india_holidays = holidays.country_holidays("IN", years=years)

holiday_records = []

for date in weather["date"]:
    holiday_name = india_holidays.get(date)

    holiday_records.append({
        "date": date,
        "is_holiday": holiday_name is not None,
        "holiday_name": holiday_name if holiday_name else ""
    })

holiday_df = pd.DataFrame(holiday_records)

holiday_df.to_csv(OUTPUT, index=False)

print(holiday_df.head())
print()
print(f"Saved to {OUTPUT}")
print(f"Total Holidays: {holiday_df['is_holiday'].sum()}")

holiday_only = holiday_df[holiday_df["is_holiday"]]

print(holiday_only)