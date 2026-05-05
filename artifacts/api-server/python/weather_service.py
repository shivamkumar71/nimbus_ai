"""
WeatherService — async HTTP client wrapper around Open-Meteo APIs.
All network I/O uses httpx for async support compatible with FastAPI.
Part of the Nimbus Weather API.
"""

from datetime import datetime, timezone
from typing import Optional
import httpx

from models import (
    AirQualityResponse,
    AirQualityCurrent,
    GeocodingResult,
    ReverseGeocodeResponse,
    WeatherResponse,
    CurrentWeather,
    HourlyWeather,
    DailyWeather,
)

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_GEO = "https://geocoding-api.open-meteo.com/v1/search"
OPEN_METEO_AQI = "https://air-quality-api.open-meteo.com/v1/air-quality"
NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse"

CURRENT_VARS = ",".join([
    "temperature_2m", "apparent_temperature", "relative_humidity_2m",
    "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
    "precipitation", "surface_pressure", "visibility", "uv_index",
    "weather_code", "is_day", "cloud_cover", "dew_point_2m",
])

HOURLY_VARS = ",".join([
    "temperature_2m", "apparent_temperature", "precipitation_probability",
    "precipitation", "weather_code", "wind_speed_10m", "uv_index",
    "relative_humidity_2m", "visibility", "is_day",
])

DAILY_VARS = ",".join([
    "weather_code", "temperature_2m_max", "temperature_2m_min",
    "apparent_temperature_max", "apparent_temperature_min",
    "sunrise", "sunset", "precipitation_sum", "precipitation_probability_max",
    "wind_speed_10m_max", "uv_index_max",
])

AQI_CURRENT_VARS = ",".join([
    "us_aqi", "pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "ozone", "dust"
])

AQI_HOURLY_VARS = ",".join([
    "us_aqi", "pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "ozone", "dust"
])


def _calculate_us_aqi_from_pm25(pm25: float) -> int:
    """
    Calculate US AQI from PM2.5 concentration using EPA breakpoints.
    This serves as a reliable fallback when the model AQI is missing or zero.
    """
    breakpoints = [
        (0.0,   12.0,   0,   50),
        (12.1,  35.4,   51,  100),
        (35.5,  55.4,   101, 150),
        (55.5,  150.4,  151, 200),
        (150.5, 250.4,  201, 300),
        (250.5, 350.4,  301, 400),
        (350.5, 500.4,  401, 500),
    ]
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= pm25 <= c_hi:
            aqi = round((i_hi - i_lo) / (c_hi - c_lo) * (pm25 - c_lo) + i_lo)
            return max(0, min(500, aqi))
    return 500 if pm25 > 500 else 0


def _calculate_us_aqi_from_pm10(pm10: float) -> int:
    """
    Calculate US AQI from PM10 concentration using EPA breakpoints.
    """
    breakpoints = [
        (0,    54,   0,   50),
        (55,   154,  51,  100),
        (155,  254,  101, 150),
        (255,  354,  151, 200),
        (355,  424,  201, 300),
        (425,  504,  301, 400),
        (505,  604,  401, 500),
    ]
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= pm10 <= c_hi:
            aqi = round((i_hi - i_lo) / (c_hi - c_lo) * (pm10 - c_lo) + i_lo)
            return max(0, min(500, aqi))
    return 500 if pm10 > 604 else 0


def _best_value_from_hourly(times: list, values: list, now_utc: datetime) -> Optional[float]:
    """
    Walk backwards through hourly values to find the most recent non-null reading
    that is not in the future. Looks back up to 6 hours.
    """
    best = None
    for i in range(len(times) - 1, -1, -1):
        try:
            t = datetime.fromisoformat(times[i].replace("Z", "+00:00"))
            if t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            if t > now_utc:
                continue
            val = values[i]
            if val is not None:
                best = val
                break
        except Exception:
            continue
    return best


class WeatherService:
    def __init__(self, client: httpx.AsyncClient):
        self.client = client

    async def search_locations(self, query: str, count: int = 8) -> list[GeocodingResult]:
        resp = await self.client.get(OPEN_METEO_GEO, params={
            "name": query,
            "count": count,
            "language": "en",
            "format": "json",
        })
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        return [
            GeocodingResult(
                id=r.get("id"),
                name=r["name"],
                latitude=r["latitude"],
                longitude=r["longitude"],
                country=r.get("country", ""),
                country_code=r.get("country_code", ""),
                admin1=r.get("admin1"),
                population=r.get("population"),
                timezone=r.get("timezone"),
            )
            for r in results
        ]

    async def reverse_geocode(self, lat: float, lon: float) -> Optional[ReverseGeocodeResponse]:
        try:
            resp = await self.client.get(
                NOMINATIM_BASE,
                params={"lat": lat, "lon": lon, "format": "json", "addressdetails": 1},
                headers={"Accept-Language": "en", "User-Agent": "Nimbus/1.0"},
            )
            resp.raise_for_status()
            data = resp.json()
            addr = data.get("address", {})
            name = (
                addr.get("city")
                or addr.get("town")
                or addr.get("village")
                or addr.get("county")
                or "Current Location"
            )
            # Nominatim may return null values — coerce to string defaults
            country = addr.get("country") or ""
            country_code = (addr.get("country_code") or "").upper()
            admin1 = addr.get("state") or addr.get("region") or None
            return ReverseGeocodeResponse(
                id=0,
                name=name,
                latitude=lat,
                longitude=lon,
                country=country,
                country_code=country_code,
                admin1=admin1,
            )
        except Exception:
            return None

    async def fetch_weather(self, lat: float, lon: float) -> WeatherResponse:
        resp = await self.client.get(OPEN_METEO_BASE, params={
            "latitude": lat,
            "longitude": lon,
            "current": CURRENT_VARS,
            "hourly": HOURLY_VARS,
            "daily": DAILY_VARS,
            "wind_speed_unit": "kmh",
            "forecast_days": 7,
            "timezone": "auto",
        })
        resp.raise_for_status()
        raw = resp.json()

        cur = raw["current"]
        hrly = raw["hourly"]
        dly = raw["daily"]

        return WeatherResponse(
            timezone=raw.get("timezone", "UTC"),
            timezone_abbreviation=raw.get("timezone_abbreviation", "UTC"),
            current_units=raw.get("current_units", {}),
            current=CurrentWeather(
                temperature_2m=cur["temperature_2m"],
                apparent_temperature=cur["apparent_temperature"],
                relative_humidity_2m=cur["relative_humidity_2m"],
                wind_speed_10m=cur["wind_speed_10m"],
                wind_direction_10m=cur["wind_direction_10m"],
                wind_gusts_10m=cur["wind_gusts_10m"],
                precipitation=cur.get("precipitation", 0.0),
                surface_pressure=cur["surface_pressure"],
                visibility=cur.get("visibility", 10000),
                uv_index=cur.get("uv_index", 0.0),
                weather_code=cur["weather_code"],
                is_day=cur.get("is_day", 1),
                cloud_cover=cur.get("cloud_cover", 0),
                dew_point_2m=cur.get("dew_point_2m", 0.0),
            ),
            hourly=HourlyWeather(
                time=hrly["time"],
                temperature_2m=hrly["temperature_2m"],
                apparent_temperature=hrly["apparent_temperature"],
                precipitation_probability=hrly["precipitation_probability"],
                precipitation=hrly["precipitation"],
                weather_code=hrly["weather_code"],
                wind_speed_10m=hrly["wind_speed_10m"],
                uv_index=hrly["uv_index"],
                relative_humidity_2m=hrly["relative_humidity_2m"],
                visibility=hrly["visibility"],
                is_day=hrly["is_day"],
            ),
            daily=DailyWeather(
                time=dly["time"],
                weather_code=dly["weather_code"],
                temperature_2m_max=dly["temperature_2m_max"],
                temperature_2m_min=dly["temperature_2m_min"],
                apparent_temperature_max=dly["apparent_temperature_max"],
                apparent_temperature_min=dly["apparent_temperature_min"],
                sunrise=dly["sunrise"],
                sunset=dly["sunset"],
                precipitation_sum=dly["precipitation_sum"],
                precipitation_probability_max=dly["precipitation_probability_max"],
                wind_speed_10m_max=dly["wind_speed_10m_max"],
                uv_index_max=dly["uv_index_max"],
            ),
        )

    async def fetch_air_quality(self, lat: float, lon: float) -> AirQualityResponse:
        """
        Fetch air quality with improved accuracy:
        - Requests both current + hourly data with timezone auto-detection
        - Walks back through recent hourly readings to find the most recent
          non-null value for each pollutant (avoids stale or missing current values)
        - If us_aqi is still missing or zero, recalculates it from PM2.5/PM10
          using EPA breakpoints for the most accurate AQI derivation
        """
        resp = await self.client.get(OPEN_METEO_AQI, params={
            "latitude": lat,
            "longitude": lon,
            "current": AQI_CURRENT_VARS,
            "hourly": AQI_HOURLY_VARS,
            "timezone": "auto",
            "past_hours": 6,
            "forecast_hours": 1,
        })
        resp.raise_for_status()
        raw = resp.json()

        cur = raw.get("current", {})
        hrly = raw.get("hourly", {})
        times = hrly.get("time", [])
        now_utc = datetime.now(timezone.utc)

        def resolve(current_val, hourly_key: str) -> Optional[float]:
            """
            Use current value if it is a valid positive number.
            Otherwise fall back to the most recent non-null hourly reading.
            """
            if current_val is not None and current_val > 0:
                return current_val
            if times and hourly_key in hrly:
                return _best_value_from_hourly(times, hrly[hourly_key], now_utc)
            return current_val

        us_aqi_raw = resolve(cur.get("us_aqi"), "us_aqi")
        pm2_5 = resolve(cur.get("pm2_5"), "pm2_5")
        pm10 = resolve(cur.get("pm10"), "pm10")
        carbon_monoxide = resolve(cur.get("carbon_monoxide"), "carbon_monoxide")
        nitrogen_dioxide = resolve(cur.get("nitrogen_dioxide"), "nitrogen_dioxide")
        ozone = resolve(cur.get("ozone"), "ozone")
        dust = resolve(cur.get("dust"), "dust")

        # Derive AQI from pollutants if model value is missing or zero
        us_aqi = us_aqi_raw
        if (us_aqi is None or us_aqi == 0):
            candidates = []
            if pm2_5 is not None and pm2_5 >= 0:
                candidates.append(_calculate_us_aqi_from_pm25(pm2_5))
            if pm10 is not None and pm10 >= 0:
                candidates.append(_calculate_us_aqi_from_pm10(pm10))
            if candidates:
                us_aqi = max(candidates)

        return AirQualityResponse(
            current=AirQualityCurrent(
                us_aqi=int(round(us_aqi)) if us_aqi is not None else None,
                pm10=round(pm10, 1) if pm10 is not None else None,
                pm2_5=round(pm2_5, 1) if pm2_5 is not None else None,
                carbon_monoxide=round(carbon_monoxide, 1) if carbon_monoxide is not None else None,
                nitrogen_dioxide=round(nitrogen_dioxide, 1) if nitrogen_dioxide is not None else None,
                ozone=round(ozone, 1) if ozone is not None else None,
                dust=round(dust, 1) if dust is not None else None,
            )
        )
