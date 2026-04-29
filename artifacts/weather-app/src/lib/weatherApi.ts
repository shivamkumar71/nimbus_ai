export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
  admin2?: string;
  population?: number;
  timezone?: string;
}

export interface CurrentWeather {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  precipitation: number;
  surface_pressure: number;
  visibility: number;
  uv_index: number;
  weather_code: number;
  is_day: number;
  cloud_cover: number;
  dew_point_2m: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  uv_index: number[];
  relative_humidity_2m: number[];
  visibility: number[];
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  uv_index_max: number[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
  timezone: string;
  timezone_abbreviation: string;
  current_units: Record<string, string>;
}

export interface AirQualityData {
  current: {
    us_aqi: number;
    pm10: number;
    pm2_5: number;
    carbon_monoxide: number;
    nitrogen_dioxide: number;
    ozone: number;
    dust: number;
  };
}

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`
  );
  const data = await res.json();
  return data.results || [];
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return {
      id: 0,
      name: data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown',
      latitude: lat,
      longitude: lon,
      country: data.address?.country || '',
      country_code: data.address?.country_code?.toUpperCase() || '',
      admin1: data.address?.state,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch {
    return null;
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: [
      'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
      'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
      'precipitation', 'surface_pressure', 'visibility', 'uv_index',
      'weather_code', 'is_day', 'cloud_cover', 'dew_point_2m'
    ].join(','),
    hourly: [
      'temperature_2m', 'apparent_temperature', 'precipitation_probability',
      'precipitation', 'weather_code', 'wind_speed_10m', 'uv_index',
      'relative_humidity_2m', 'visibility'
    ].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'apparent_temperature_max', 'apparent_temperature_min',
      'sunrise', 'sunset', 'precipitation_sum', 'precipitation_probability_max',
      'wind_speed_10m_max', 'uv_index_max'
    ].join(','),
    wind_speed_unit: 'kmh',
    forecast_days: '7',
    timezone: 'auto',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Failed to fetch weather data');
  return res.json();
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: ['us_aqi', 'pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide', 'ozone', 'dust'].join(','),
  });
  const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
  if (!res.ok) throw new Error('Failed to fetch air quality');
  return res.json();
}

export interface WeatherDescription {
  label: string;
  icon: string;
  bg: string;
  gradient: string;
  particleType: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog' | 'drizzle';
}

export function getWeatherDescription(code: number, isDay: number = 1): WeatherDescription {
  const night = isDay === 0;
  if (code === 0) return {
    label: night ? 'Clear Night' : 'Clear Sky',
    icon: night ? '🌙' : '☀️',
    bg: night ? 'from-indigo-950 via-blue-950 to-slate-900' : 'from-sky-400 via-blue-500 to-indigo-600',
    gradient: night ? 'linear-gradient(135deg, #1e1b4b, #172554, #0f172a)' : 'linear-gradient(135deg, #38bdf8, #3b82f6, #4338ca)',
    particleType: 'clear',
  };
  if (code <= 2) return {
    label: 'Partly Cloudy',
    icon: '⛅',
    bg: 'from-slate-700 via-blue-800 to-indigo-900',
    gradient: 'linear-gradient(135deg, #334155, #1e3a8a, #312e81)',
    particleType: 'cloudy',
  };
  if (code === 3) return {
    label: 'Overcast',
    icon: '☁️',
    bg: 'from-slate-700 via-slate-800 to-slate-900',
    gradient: 'linear-gradient(135deg, #475569, #334155, #1e293b)',
    particleType: 'cloudy',
  };
  if (code <= 49) return {
    label: 'Foggy',
    icon: '🌫️',
    bg: 'from-slate-600 via-slate-700 to-slate-800',
    gradient: 'linear-gradient(135deg, #64748b, #475569, #334155)',
    particleType: 'fog',
  };
  if (code <= 59) return {
    label: 'Drizzle',
    icon: '🌦️',
    bg: 'from-slate-700 via-blue-900 to-slate-900',
    gradient: 'linear-gradient(135deg, #334155, #1e3a8a, #0f172a)',
    particleType: 'drizzle',
  };
  if (code <= 69) return {
    label: 'Rainy',
    icon: '🌧️',
    bg: 'from-slate-800 via-blue-950 to-slate-900',
    gradient: 'linear-gradient(135deg, #1e293b, #172554, #0f172a)',
    particleType: 'rain',
  };
  if (code <= 79) return {
    label: 'Snowy',
    icon: '❄️',
    bg: 'from-slate-600 via-blue-900 to-indigo-950',
    gradient: 'linear-gradient(135deg, #64748b, #1e3a8a, #1e1b4b)',
    particleType: 'snow',
  };
  if (code <= 84) return {
    label: 'Rain Showers',
    icon: '🌦️',
    bg: 'from-slate-700 via-blue-900 to-slate-900',
    gradient: 'linear-gradient(135deg, #334155, #1e3a8a, #0f172a)',
    particleType: 'rain',
  };
  if (code <= 94) return {
    label: 'Snow Showers',
    icon: '🌨️',
    bg: 'from-slate-600 via-blue-900 to-indigo-950',
    gradient: 'linear-gradient(135deg, #64748b, #1e3a8a, #1e1b4b)',
    particleType: 'snow',
  };
  return {
    label: 'Thunderstorm',
    icon: '⛈️',
    bg: 'from-gray-900 via-slate-900 to-purple-950',
    gradient: 'linear-gradient(135deg, #111827, #0f172a, #2e1065)',
    particleType: 'storm',
  };
}

export function getWindDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function getAqiLabel(aqi: number): { label: string; color: string; description: string } {
  if (aqi <= 50) return { label: 'Good', color: '#22c55e', description: 'Air quality is satisfactory' };
  if (aqi <= 100) return { label: 'Moderate', color: '#eab308', description: 'Acceptable air quality' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#f97316', description: 'Sensitive groups may be affected' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444', description: 'Everyone may experience effects' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#a855f7', description: 'Health alert for everyone' };
  return { label: 'Hazardous', color: '#7f1d1d', description: 'Emergency conditions' };
}

export function getUvLabel(uvi: number): { label: string; color: string } {
  if (uvi <= 2) return { label: 'Low', color: '#22c55e' };
  if (uvi <= 5) return { label: 'Moderate', color: '#eab308' };
  if (uvi <= 7) return { label: 'High', color: '#f97316' };
  if (uvi <= 10) return { label: 'Very High', color: '#ef4444' };
  return { label: 'Extreme', color: '#7c3aed' };
}

export function formatTime(timeStr: string, tz?: string): string {
  const date = new Date(timeStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz || undefined,
  });
}

export function formatHour(timeStr: string): string {
  const date = new Date(timeStr);
  const h = date.getHours();
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export function formatDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getHourlyDataForNext24h(hourly: HourlyWeather): {
  time: string; temp: number; code: number; precipProb: number; wind: number;
}[] {
  const now = new Date();
  const results = [];
  for (let i = 0; i < hourly.time.length; i++) {
    const t = new Date(hourly.time[i]);
    if (t >= now && results.length < 24) {
      results.push({
        time: hourly.time[i],
        temp: hourly.temperature_2m[i],
        code: hourly.weather_code[i],
        precipProb: hourly.precipitation_probability[i],
        wind: hourly.wind_speed_10m[i],
      });
    }
  }
  return results;
}
