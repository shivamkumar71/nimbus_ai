"""
WeatherService — async HTTP client wrapper around Open-Meteo APIs.
All network I/O uses httpx for async support compatible with FastAPI.
Part of the Nimbus Weather API.
"""

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

AQI_VARS = ",".join([
    "us_aqi", "pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "ozone", "dust"
])


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
                or "Unknown"
            )
            return ReverseGeocodeResponse(
                id=0,
                name=name,
                latitude=lat,
                longitude=lon,
                country=addr.get("country", ""),
                country_code=addr.get("country_code", "").upper(),
                admin1=addr.get("state"),
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
        resp = await self.client.get(OPEN_METEO_AQI, params={
            "latitude": lat,
            "longitude": lon,
            "current": AQI_VARS,
        })
        resp.raise_for_status()
        raw = resp.json()
        cur = raw.get("current", {})
        return AirQualityResponse(
            current=AirQualityCurrent(
                us_aqi=cur.get("us_aqi"),
                pm10=cur.get("pm10"),
                pm2_5=cur.get("pm2_5"),
                carbon_monoxide=cur.get("carbon_monoxide"),
                nitrogen_dioxide=cur.get("nitrogen_dioxide"),
                ozone=cur.get("ozone"),
                dust=cur.get("dust"),
            )
        )
