import { motion } from "framer-motion";
import { Droplets, Wind, ArrowUp, ArrowDown } from "lucide-react";
import { getWeatherDescription } from "@/lib/weatherApi";
import AnimatedWeatherIcon from "@/components/AnimatedWeatherIcon";
import type { DailyWeather } from "@/lib/weatherApi";

interface Props {
  daily: DailyWeather;
}

function formatDayFull(dateStr: string, index: number): { day: string; date: string } {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (index === 0) return { day: 'Today', date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) };
  if (date.toDateString() === tomorrow.toDateString()) return { day: 'Tomorrow', date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) };
  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
  };
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

      <div className="divide-y divide-white/[0.05]">
        {daily.time.map((date, i) => {
          const desc = getWeatherDescription(daily.weather_code[i]);
          const dayMin = daily.temperature_2m_min[i];
          const dayMax = daily.temperature_2m_max[i];
          const barStart = ((dayMin - globalMin) / range) * 100;
          const barWidth = ((dayMax - dayMin) / range) * 100;
          const { day, date: dateLabel } = formatDayFull(date, i);

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.42 + i * 0.05 }}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 hover:bg-white/[0.04] transition-all cursor-default"
              data-testid={`daily-item-${i}`}
            >
              {/* Day + date */}
              <div className="w-20 flex-shrink-0">
                <div className={`font-semibold text-sm ${i === 0 ? 'text-blue-400' : 'text-white'}`}>
                  {day}
                </div>
                <div className="text-white/40 text-xs mt-0.5">{dateLabel}</div>
                {daily.precipitation_probability_max[i] > 20 && (
                  <div className="flex items-center gap-0.5 text-blue-300/70 text-xs mt-0.5">
                    <Droplets className="w-3 h-3" />
                    {daily.precipitation_probability_max[i]}%
                  </div>
                )}
              </div>

              {/* Animated icon */}
              <div className="flex items-center gap-2 w-20 flex-shrink-0">
                <AnimatedWeatherIcon code={daily.weather_code[i]} isDay={1} size={34} />
                <span className="text-white/45 text-xs hidden sm:block truncate leading-tight">{desc.label}</span>
              </div>

              {/* Wind */}
              <div className="hidden md:flex items-center gap-1 text-white/35 text-xs w-14 flex-shrink-0">
                <Wind className="w-3 h-3" />
                {Math.round(daily.wind_speed_10m_max[i])}
              </div>

              {/* Temp range bar */}
              <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex items-center gap-0.5 text-blue-400 text-sm font-medium w-10 justify-end flex-shrink-0">
                  <ArrowDown className="w-3 h-3" />
                  {Math.round(dayMin)}°
                </div>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden min-w-[40px]">
                  <motion.div
                    className="absolute h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(barWidth, 8)}%` }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.7, ease: 'easeOut' }}
                    style={{
                      left: `${barStart}%`,
                      background: 'linear-gradient(90deg, #60a5fa, #34d399, #f97316)',
                    }}
                  />
                </div>
                <div className="flex items-center gap-0.5 text-orange-400 text-sm font-medium w-10 flex-shrink-0">
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
