import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Cloud } from "lucide-react";

import WeatherBackground from "@/components/WeatherBackground";
import WeatherParticles from "@/components/WeatherParticles";
import WeatherHeader from "@/components/WeatherHeader";
import CurrentWeatherCard from "@/components/CurrentWeatherCard";
import HourlyForecast from "@/components/HourlyForecast";
import DailyForecast from "@/components/DailyForecast";
import AirQualityCard from "@/components/AirQualityCard";
import UVIndexCard from "@/components/UVIndexCard";
import SunriseSunsetCard from "@/components/SunriseSunsetCard";
import WindCard from "@/components/WindCard";
import HumidityCard from "@/components/HumidityCard";
import PressureCard from "@/components/PressureCard";
import VisibilityCard from "@/components/VisibilityCard";
import TemperatureChart from "@/components/TemperatureChart";
import ErrorScreen from "@/components/ErrorScreen";
import PredictionCard from "@/components/PredictionCard";

import {
  fetchWeather, fetchAirQuality, fetchPrediction, reverseGeocode,
  getWeatherDescription, getHourlyDataForNext24h,
  type WeatherData, type AirQualityData, type PredictionData, type GeocodingResult
} from "@/lib/weatherApi";
import type { SavedLocation } from "@/components/WeatherHeader";

const DEFAULT_LOCATION: SavedLocation = {
  name: 'London',
  country: 'United Kingdom',
  admin1: 'England',
  latitude: 51.5074,
  longitude: -0.1278,
};

function getLocalTime(timezone: string): string {
  return new Date().toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function WeatherPage() {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Fetching weather...");
  const [error, setError] = useState<string | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [localTime, setLocalTime] = useState('');
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const initialized = useRef(false);

  async function loadWeatherForLocation(loc: SavedLocation) {
    setLoading(true);
    setError(null);
    setPrediction(null);
    setLoadingMsg(`Loading ${loc.name}...`);
    try {
      const [w, aq, pred] = await Promise.allSettled([
        fetchWeather(loc.latitude, loc.longitude),
        fetchAirQuality(loc.latitude, loc.longitude),
        fetchPrediction(loc.latitude, loc.longitude),
      ]);
      if (w.status === 'fulfilled') {
        setWeather(w.value);
        setLastUpdated(new Date());
      } else {
        throw new Error('Failed to fetch weather data from Python API');
      }
      if (aq.status === 'fulfilled') setAirQuality(aq.value);
      if (pred.status === 'fulfilled') setPrediction(pred.value);
      setLocation(loc);
      try { localStorage.setItem('weather_last_location', JSON.stringify(loc)); } catch {}
    } catch (e: any) {
      setError(e.message || 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }

  async function tryGeolocate() {
    setIsGeolocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 });
      });
      const { latitude, longitude } = pos.coords;
      const geo = await reverseGeocode(latitude, longitude).catch(() => null);
      const loc: SavedLocation = geo
        ? { name: geo.name, country: geo.country, admin1: geo.admin1, latitude, longitude }
        : { name: 'My Location', country: '', latitude, longitude };
      await loadWeatherForLocation(loc);
    } catch {
      await loadWeatherForLocation(DEFAULT_LOCATION);
    } finally {
      setIsGeolocating(false);
    }
  }

  // Initialize once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let savedLocs: SavedLocation[] = [];
    try {
      const raw = localStorage.getItem('weather_saved_locations');
      if (raw) { savedLocs = JSON.parse(raw); setSavedLocations(savedLocs); }
    } catch {}

    try {
      const lastRaw = localStorage.getItem('weather_last_location');
      if (lastRaw) {
        const loc = JSON.parse(lastRaw) as SavedLocation;
        loadWeatherForLocation(loc);
        return;
      }
    } catch {}

    tryGeolocate();
  }, []);

  // Live clock
  useEffect(() => {
    if (!weather) return;
    const update = () => setLocalTime(getLocalTime(weather.timezone));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [weather]);

  // Favorite sync
  useEffect(() => {
    if (!location) return;
    setIsFavorited(savedLocations.some(s => s.name === location.name && s.country === location.country));
  }, [location, savedLocations]);

  function handleSelectLocation(geo: GeocodingResult) {
    loadWeatherForLocation({
      name: geo.name,
      country: geo.country,
      admin1: geo.admin1,
      latitude: geo.latitude,
      longitude: geo.longitude,
    });
  }

  function toggleFavorite() {
    if (!location) return;
    const exists = savedLocations.some(s => s.name === location.name && s.country === location.country);
    const newSaved = exists
      ? savedLocations.filter(s => !(s.name === location.name && s.country === location.country))
      : [...savedLocations, location];
    setSavedLocations(newSaved);
    try { localStorage.setItem('weather_saved_locations', JSON.stringify(newSaved)); } catch {}
  }

  const hourlyItems = weather ? getHourlyDataForNext24h(weather.hourly) : [];
  const desc = weather ? getWeatherDescription(weather.current.weather_code, weather.current.is_day) : null;

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Dynamic background */}
      {desc ? (
        <>
          <WeatherBackground
            particleType={desc.particleType}
            isDay={weather?.current.is_day ?? 1}
            timezone={weather?.timezone}
            sunrise={weather?.daily.sunrise?.[0]}
            sunset={weather?.daily.sunset?.[0]}
          />
          <WeatherParticles
            type={desc.particleType}
            isDay={weather?.current.is_day ?? 1}
          />
        </>
      ) : (
        <div className="fixed inset-0 z-0" style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #0c1a2e)' }}>
          {/* Animated orbs while loading */}
          <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', animation: 'float 4s ease-in-out infinite' }} />
          <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite reverse' }} />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <WeatherHeader
          weatherCode={weather?.current.weather_code}
          isDay={weather?.current.is_day}
          location={location}
          savedLocations={savedLocations}
          isFavorited={isFavorited}
          loading={loading}
          isGeolocating={isGeolocating}
          onSelect={handleSelectLocation}
          onGeolocate={tryGeolocate}
          onToggleFavorite={toggleFavorite}
          onRefresh={() => location && loadWeatherForLocation(location)}
          onSelectSaved={loadWeatherForLocation}
        />

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 py-6 pb-16">
          {/* Loading indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 gap-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
                >
                  <Cloud className="w-9 h-9 text-blue-400" />
                </div>
                <div className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <div className="gradient-text text-xl font-bold mb-1">Nimbus</div>
                <div className="text-white/50 text-sm">{loadingMsg}</div>
              </div>
              <div className="flex gap-2">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    animate={{ y: [0,-8,0], opacity: [0.4,1,0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i*0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {error && !weather && (
            <ErrorScreen
              message={error}
              onGeolocate={tryGeolocate}
              onRetry={() => location && loadWeatherForLocation(location)}
            />
          )}

          <AnimatePresence>
            {weather && location && !loading && (
              <motion.div
                key={`${location.name}-${location.country}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Last updated */}
                {lastUpdated && (
                  <div className="text-right text-white/30 text-xs">
                    Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                )}

                {/* Main card */}
                <CurrentWeatherCard
                  current={weather.current}
                  location={location}
                  timezone={weather.timezone}
                  localTime={localTime}
                />

                {/* Hourly */}
                {hourlyItems.length > 0 && (
                  <HourlyForecast items={hourlyItems} />
                )}

                {/* Temp chart */}
                <TemperatureChart hourlyData={hourlyItems.map(h => ({
                  time: h.time, temp: h.temp, precipProb: h.precipProb, code: h.code,
                }))} />

                {/* Detail cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <WindCard
                    speed={weather.current.wind_speed_10m}
                    direction={weather.current.wind_direction_10m}
                    gusts={weather.current.wind_gusts_10m}
                  />
                  <HumidityCard
                    humidity={weather.current.relative_humidity_2m}
                    dewPoint={weather.current.dew_point_2m}
                  />
                  <PressureCard pressure={weather.current.surface_pressure} />
                  <UVIndexCard
                    uvIndex={weather.current.uv_index}
                    maxUv={weather.daily.uv_index_max[0]}
                  />
                  <VisibilityCard visibility={weather.current.visibility} />
                  {weather.daily.sunrise?.[0] && weather.daily.sunset?.[0] && (
                    <SunriseSunsetCard
                      sunrise={weather.daily.sunrise[0]}
                      sunset={weather.daily.sunset[0]}
                      timezone={weather.timezone}
                    />
                  )}
                </div>

                {/* Air quality */}
                {airQuality && <AirQualityCard data={airQuality} />}

                {/* ML Prediction from Python */}
                {prediction && <PredictionCard prediction={prediction} />}

                {/* 7-day forecast */}
                <DailyForecast daily={weather.daily} />

                {/* Footer */}
                <footer className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-white/25 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
                      >
                        <Cloud className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-semibold text-white/40">Nimbus</span>
                    </div>
                    <div className="text-center">
                      Accurate forecasts for every corner of the world
                    </div>
                    <div className="text-white/20">
                      © {new Date().getFullYear()} Nimbus Weather. All rights reserved.
                    </div>
                  </div>
                </footer>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
