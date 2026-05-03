"""
Nimbus Weather API — Python FastAPI Backend
Fetches, processes, and serves weather data for the Nimbus frontend.
Includes ML-based temperature trend prediction using NumPy + scikit-learn.
"""

import os
from contextlib import asynccontextmanager

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from models import (
    AirQualityResponse,
    GeocodingResponse,
    HealthResponse,
    PredictionResponse,
    ReverseGeocodeResponse,
    WeatherResponse,
)
from weather_service import WeatherService
from prediction_service import PredictionService

# ── App setup ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage shared HTTP client lifecycle."""
    app.state.http_client = httpx.AsyncClient(timeout=15.0)
    yield
    await app.state.http_client.aclose()


app = FastAPI(
    title="Nimbus Weather API",
    description="Python-powered weather data API for Nimbus — built with FastAPI, NumPy, and scikit-learn.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow CORS from the frontend (the shared proxy handles auth in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/api/healthz", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", service="Nimbus Weather API", language="Python 3.12 + FastAPI")


@app.get("/api/geocode", response_model=GeocodingResponse)
async def geocode(
    name: str = Query(..., description="City name to search for"),
    count: int = Query(8, ge=1, le=20),
):
    """Search for cities by name using Open-Meteo Geocoding API."""
    service = WeatherService(app.state.http_client)
    results = await service.search_locations(name, count)
    return GeocodingResponse(results=results)


@app.get("/api/reverse-geocode", response_model=ReverseGeocodeResponse)
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Reverse geocode a lat/lon to a city name using Nominatim."""
    service = WeatherService(app.state.http_client)
    result = await service.reverse_geocode(lat, lon)
    if result is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return result


@app.get("/api/weather", response_model=WeatherResponse)
async def weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """
    Fetch full weather data (current + hourly + daily) for a location.
    Data is fetched from Open-Meteo, processed in Python, and returned.
    """
    service = WeatherService(app.state.http_client)
    data = await service.fetch_weather(lat, lon)
    return data


@app.get("/api/air-quality", response_model=AirQualityResponse)
async def air_quality(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Fetch air quality data from Open-Meteo Air Quality API."""
    service = WeatherService(app.state.http_client)
    data = await service.fetch_air_quality(lat, lon)
    return data


@app.get("/api/predict", response_model=PredictionResponse)
async def predict_temperature(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """
    ML-based temperature trend prediction.
    Uses the next 48h of hourly data from Open-Meteo and fits a
    polynomial regression model (via NumPy + scikit-learn) to predict
    the temperature peak/low for the next 24 hours.
    """
    service = WeatherService(app.state.http_client)
    weather_data = await service.fetch_weather(lat, lon)

    predictor = PredictionService()
    prediction = predictor.predict(weather_data)
    return prediction


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
