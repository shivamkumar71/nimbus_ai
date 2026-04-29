# SkyPulse — Weather Prediction Web App

## Overview

A professional, fully-animated weather prediction web app with a **Python FastAPI backend** and React frontend. Uses the free Open-Meteo API for real-time weather data, processed through Python and served to the frontend via a REST API.

## Architecture

```
Browser (React + Vite)
    ↓ HTTP fetch to /api/*
Python FastAPI Server (artifacts/api-server/python/)
    ↓ httpx async requests
Open-Meteo APIs (weather, air quality, geocoding)
```

## Stack

- **Backend**: Python 3.12 + FastAPI + uvicorn
- **ML/Data**: NumPy, scikit-learn (polynomial regression), pandas
- **HTTP client**: httpx (async)
- **Data validation**: Pydantic v2
- **Frontend**: React + Vite (TypeScript)
- **Animations**: Framer Motion, Canvas API (particle systems), CSS keyframes
- **Charts**: Recharts
- **Styling**: Tailwind CSS v4 + glassmorphism

## Python Backend Structure (artifacts/api-server/python/)

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS, lifespan (shared httpx client), all routes |
| `models.py` | Pydantic v2 models for all request/response types |
| `weather_service.py` | Async wrapper around Open-Meteo + Nominatim APIs |
| `prediction_service.py` | scikit-learn polynomial regression for ML temperature prediction |
| `requirements.txt` | Python dependencies |

## API Endpoints (Python FastAPI)

| Endpoint | Description |
|----------|-------------|
| `GET /api/healthz` | Health check, returns Python version |
| `GET /api/geocode?name=London` | City search (Open-Meteo geocoding) |
| `GET /api/reverse-geocode?lat=&lon=` | Lat/lon to city name (Nominatim) |
| `GET /api/weather?lat=&lon=` | Full weather (current + hourly + daily) |
| `GET /api/air-quality?lat=&lon=` | AQI + pollutants (PM2.5, PM10, O₃, NO₂) |
| `GET /api/predict?lat=&lon=` | **ML prediction** — polynomial regression trend analysis |

## Frontend Features

- Dynamic animated backgrounds matching weather conditions
- Canvas particle systems (rain, snow, stars, fog, storm)
- Current weather: temp, feels-like, humidity, wind, visibility, pressure, dew point
- Hourly forecast strip (next 24h)
- 12-hour temperature trend chart (Recharts)
- 7-day forecast with color temperature bars
- Wind compass with Beaufort scale
- UV index arc gauge
- Humidity radial gauge
- Pressure needle gauge
- Sunrise/sunset arc animation
- Air quality card with pollutant breakdown
- **ML Prediction card** (Python scikit-learn results)
- City search with autocomplete, GPS geolocation
- Favorites saved to localStorage

## Key Commands

- `pnpm run typecheck` — TypeScript typecheck
- `python artifacts/api-server/python/main.py` — Run Python API directly

## Artifacts

- `artifacts/weather-app` — React + Vite frontend (serves at `/`)
- `artifacts/api-server` — **Python FastAPI backend** (serves at `/api`)
