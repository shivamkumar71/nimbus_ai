import { motion } from "framer-motion";
import { Droplets, Wind, ArrowUp, ArrowDown } from "lucide-react";
import { getWeatherDescription, formatDay } from "@/lib/weatherApi";
import type { DailyWeather } from "@/lib/weatherApi";

interface Props {
  daily: DailyWeather;
}

export default function DailyForecast({ daily }: Props) {
  const globalMin = Math.min(...daily.temperature_2m_min);
  const globalMax = Math.max(...daily.temperature_2m_max);
  const range = globalMax - globalMin || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-daily-forecast"
    >
      <div className="px-6 pt-5 pb-2">
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">7-Day Forecast</h3>
      </div>

      <div className="divide-y divide-white/05">
        {daily.time.map((date, i) => {
          const desc = getWeatherDescription(daily.weather_code[i]);
          const dayMin = daily.temperature_2m_min[i];
          const dayMax = daily.temperature_2m_max[i];
          const barStart = ((dayMin - globalMin) / range) * 100;
          const barWidth = ((dayMax - dayMin) / range) * 100;

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.42 + i * 0.05 }}
              className="flex items-center gap-4 px-6 py-4 hover:bg-white/05 transition-all cursor-default group"
              data-testid={`daily-item-${i}`}
            >
              {/* Day */}
              <div className="w-20 flex-shrink-0">
                <div className={`font-semibold text-sm ${i === 0 ? 'text-blue-400' : 'text-white'}`}>
                  {formatDay(date)}
                </div>
                {daily.precipitation_probability_max[i] > 20 && (
                  <div className="flex items-center gap-1 text-blue-300/70 text-xs mt-0.5">
                    <Droplets className="w-3 h-3" />
                    {daily.precipitation_probability_max[i]}%
                  </div>
                )}
              </div>

              {/* Icon + desc */}
              <div className="flex items-center gap-2 w-24 flex-shrink-0">
                <span className="text-xl">{desc.icon}</span>
                <span className="text-white/50 text-xs hidden sm:block truncate">{desc.label}</span>
              </div>

              {/* Wind */}
              <div className="hidden md:flex items-center gap-1 text-white/40 text-xs w-16 flex-shrink-0">
                <Wind className="w-3 h-3" />
                {Math.round(daily.wind_speed_10m_max[i])}
              </div>

              {/* Temp bar */}
              <div className="flex-1 flex items-center gap-3">
                <div className="flex items-center gap-1 text-blue-400 text-sm font-medium w-9 justify-end flex-shrink-0">
                  <ArrowDown className="w-3 h-3" />
                  {Math.round(dayMin)}°
                </div>

                <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                  <div
                    className="absolute h-full rounded-full"
                    style={{
                      left: `${barStart}%`,
                      width: `${Math.max(barWidth, 8)}%`,
                      background: 'linear-gradient(90deg, #60a5fa, #f97316)',
                    }}
                  />
                </div>

                <div className="flex items-center gap-1 text-orange-400 text-sm font-medium w-9 flex-shrink-0">
                  <ArrowUp className="w-3 h-3" />
                  {Math.round(dayMax)}°
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
