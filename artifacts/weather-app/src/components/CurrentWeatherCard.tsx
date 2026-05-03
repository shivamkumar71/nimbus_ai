import { motion } from "framer-motion";
import { Thermometer, Droplets, Wind, Eye, Gauge, Sun } from "lucide-react";
import type { CurrentWeather } from "@/lib/weatherApi";
import { getWeatherDescription, getWindDirection } from "@/lib/weatherApi";
import AnimatedWeatherIcon from "@/components/AnimatedWeatherIcon";

interface Props {
  current: CurrentWeather;
  location: { name: string; country: string; admin1?: string };
  timezone: string;
  localTime: string;
}

export default function CurrentWeatherCard({ current, location, localTime }: Props) {
  const desc = getWeatherDescription(current.weather_code, current.is_day);

  const stats = [
    { icon: Droplets,    label: 'Humidity',   value: `${current.relative_humidity_2m}%`,                                              color: '#60a5fa' },
    { icon: Wind,        label: 'Wind',        value: `${Math.round(current.wind_speed_10m)} km/h ${getWindDirection(current.wind_direction_10m)}`, color: '#34d399' },
    { icon: Eye,         label: 'Visibility',  value: `${(current.visibility / 1000).toFixed(1)} km`,                                 color: '#a78bfa' },
    { icon: Gauge,       label: 'Pressure',    value: `${Math.round(current.surface_pressure)} hPa`,                                  color: '#fbbf24' },
    { icon: Thermometer, label: 'Dew Point',   value: `${Math.round(current.dew_point_2m)}°`,                                         color: '#f472b6' },
    { icon: Sun,         label: 'Cloud Cover', value: `${current.cloud_cover}%`,                                                       color: '#94a3b8' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl p-6 md:p-8"
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
      data-testid="card-current-weather"
    >
      {/* Shimmer */}
      <div className="absolute inset-0 opacity-5 rounded-3xl"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)' }}
      />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-location-name">
              {location.name}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {[location.admin1, location.country].filter(Boolean).join(', ')}
            </p>
            <p className="text-white/40 text-xs mt-0.5">{localTime}</p>
          </motion.div>

          {/* Animated weather icon — replaces emoji */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 14 }}
            data-testid="icon-weather"
            style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))' }}
          >
            <AnimatedWeatherIcon
              code={current.weather_code}
              isDay={current.is_day}
              size={84}
            />
          </motion.div>
        </div>

        {/* Temperature */}
        <div className="flex items-end gap-4 mb-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="gradient-text font-black"
            style={{ fontSize: 'clamp(72px, 12vw, 120px)', lineHeight: 1 }}
            data-testid="text-temperature"
          >
            {Math.round(current.temperature_2m)}°
          </motion.div>
          <div className="pb-3">
            <div className="text-white font-semibold text-lg">{desc.label}</div>
            <div className="text-white/50 text-sm">Feels {Math.round(current.apparent_temperature)}°</div>
          </div>
        </div>

        <div className="h-px bg-white/10 my-6" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {stats.map(({ icon: Icon, label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              className="flex items-center gap-3 group"
              data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: `${color}18` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="text-white/50 text-xs">{label}</div>
                <div className="text-white font-semibold text-sm">{value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
