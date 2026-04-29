"""
Pydantic models for SkyPulse Weather API.
All response shapes are strongly typed for automatic validation and OpenAPI docs.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


# ── Health ─────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str
    language: str


# ── Geocoding ──────────────────────────────────────────────────────────────────

class GeocodingResult(BaseModel):
    id: Optional[int] = None
    name: str
    latitude: float
    longitude: float
    country: str
    country_code: str
    admin1: Optional[str] = None
    population: Optional[int] = None
    timezone: Optional[str] = None


class GeocodingResponse(BaseModel):
    results: list[GeocodingResult]


class ReverseGeocodeResponse(BaseModel):
    id: int = 0
    name: str
    latitude: float
    longitude: float
    country: str
    country_code: str
    admin1: Optional[str] = None
    timezone: Optional[str] = None


# ── Weather ────────────────────────────────────────────────────────────────────

class CurrentWeather(BaseModel):
    temperature_2m: float
    apparent_temperature: float
    relative_humidity_2m: int
    wind_speed_10m: float
    wind_direction_10m: float
    wind_gusts_10m: float
    precipitation: float
    surface_pressure: float
    visibility: float
    uv_index: float
    weather_code: int
    is_day: int
    cloud_cover: int
    dew_point_2m: float


class HourlyWeather(BaseModel):
    time: list[str]
    temperature_2m: list[float]
    apparent_temperature: list[float]
    precipitation_probability: list[int]
    precipitation: list[float]
    weather_code: list[int]
    wind_speed_10m: list[float]
    uv_index: list[float]
    relative_humidity_2m: list[int]
    visibility: list[float]


class DailyWeather(BaseModel):
    time: list[str]
    weather_code: list[int]
    temperature_2m_max: list[float]
    temperature_2m_min: list[float]
    apparent_temperature_max: list[float]
    apparent_temperature_min: list[float]
    sunrise: list[str]
    sunset: list[str]
    precipitation_sum: list[float]
    precipitation_probability_max: list[int]
    wind_speed_10m_max: list[float]
    uv_index_max: list[float]


class WeatherResponse(BaseModel):
    current: CurrentWeather
    hourly: HourlyWeather
    daily: DailyWeather
    timezone: str
    timezone_abbreviation: str
    current_units: dict[str, str]


# ── Air Quality ────────────────────────────────────────────────────────────────

class AirQualityCurrent(BaseModel):
    us_aqi: Optional[int] = None
    pm10: Optional[float] = None
    pm2_5: Optional[float] = None
    carbon_monoxide: Optional[float] = None
    nitrogen_dioxide: Optional[float] = None
    ozone: Optional[float] = None
    dust: Optional[float] = None


class AirQualityResponse(BaseModel):
    current: AirQualityCurrent


# ── Prediction ─────────────────────────────────────────────────────────────────

class TemperaturePoint(BaseModel):
    hour: int = Field(description="Hour offset from now (0=now, 1=+1h...)")
    predicted_temp: float = Field(description="Predicted temperature in °C")
    confidence: float = Field(description="Confidence score 0–1")


class PredictionResponse(BaseModel):
    model: str = Field(description="ML model used")
    predicted_high: float = Field(description="Predicted temperature peak in next 24h (°C)")
    predicted_low: float = Field(description="Predicted temperature low in next 24h (°C)")
    predicted_high_at_hour: int = Field(description="Hour when peak is expected (0–23)")
    predicted_low_at_hour: int = Field(description="Hour when low is expected (0–23)")
    r2_score: float = Field(description="Model R² score (goodness of fit)")
    trend: str = Field(description="'rising', 'falling', or 'stable'")
    trend_delta: float = Field(description="Expected temperature change over 24h (°C)")
    hourly_predictions: list[TemperaturePoint]
    summary: str = Field(description="Human-readable prediction summary")
