# SkyPulse — Weather Prediction Web App

## Overview

A professional, fully-animated weather prediction web app built with React + Vite. Uses the free **Open-Meteo API** (no API key required) for real-time weather data worldwide.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/weather-app)
- **Animations**: Framer Motion, Canvas API, CSS keyframes
- **Charts**: Recharts (temperature trend chart)
- **Weather data**: Open-Meteo API (free, no key needed)
- **Air quality**: Open-Meteo Air Quality API
- **Geocoding**: Open-Meteo Geocoding + Nominatim reverse geocoding
- **API framework**: Express 5 (API server, separate artifact)
- **Styling**: Tailwind CSS v4 + glassmorphism design system

## Features

- Real-time weather with live data from Open-Meteo
- Dynamic animated backgrounds matching weather conditions (rain, snow, storm, clear, fog, cloudy)
- Canvas-based particle systems (rain drops, snowflakes, stars)
- Current weather: temperature, feels-like, humidity, wind, visibility, pressure, dew point, cloud cover
- Hourly forecast (next 24 hours) with scrollable animated cards
- 7-day forecast with temperature range bars
- 12-hour temperature trend chart with precipitation overlay
- Wind compass card with Beaufort scale
- UV index with animated gauge
- Humidity radial gauge
- Pressure gauge with needle
- Sunrise/sunset arc animation
- Visibility card with layered progress bars
- Air quality index (AQI) with pollutant breakdown
- Location search (autocomplete) + GPS geolocation
- Favorite locations (saved to localStorage)
- Dark glassmorphism UI with gradient text

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Artifacts

- `artifacts/weather-app` — Main weather app (React + Vite, serves at `/`)
- `artifacts/api-server` — Backend API server (Express, serves at `/api`)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
