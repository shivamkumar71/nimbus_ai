import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Droplets, Wind } from "lucide-react";
import { formatHour } from "@/lib/weatherApi";
import AnimatedWeatherIcon from "@/components/AnimatedWeatherIcon";

interface HourlyItem {
  time: string;
  temp: number;
  code: number;
  precipProb: number;
  wind: number;
  isDay?: number;
}

interface Props {
  items: HourlyItem[];
}

export default function HourlyForecast({ items }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  }

  const maxTemp = Math.max(...items.map(i => i.temp));
  const minTemp = Math.min(...items.map(i => i.temp));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-hourly-forecast"
    >
      <div className="p-5 flex items-center justify-between">
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">Hourly Forecast</h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            data-testid="button-scroll-right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 px-4 pb-5 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, i) => {
          const tempRatio = maxTemp !== minTemp ? (item.temp - minTemp) / (maxTemp - minTemp) : 0.5;
          const isNow = i === 0;
          const hour = new Date(item.time).getHours();
          const itemIsDay = item.isDay !== undefined ? item.isDay : (hour >= 6 && hour < 20 ? 1 : 0);
          // Force clear night code (0) when it's nighttime to show moon icon regardless of weather
          const displayCode = itemIsDay === 0 ? 0 : item.code;

          return (
            <motion.div
              key={item.time}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.03 }}
              className={`flex-shrink-0 flex flex-col items-center gap-2 px-3 py-4 rounded-2xl cursor-default transition-all hover:bg-white/10 ${isNow ? 'ring-1 ring-blue-400/50' : ''}`}
              style={{
                background: isNow ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                minWidth: '78px',
              }}
              data-testid={`hourly-item-${i}`}
            >
              <div className="text-white/60 text-xs font-medium">
                {isNow ? 'Now' : formatHour(item.time)}
              </div>

              <AnimatedWeatherIcon code={displayCode} isDay={itemIsDay} size={36} />

              <div
                className="font-bold text-sm"
                style={{
                  color: `hsl(${210 + tempRatio * 30}deg, ${60 + tempRatio * 40}%, ${55 + tempRatio * 25}%)`,
                }}
              >
                {Math.round(item.temp)}°
              </div>

              {/* Mini temp bar */}
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${tempRatio * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.03, duration: 0.6 }}
                  style={{ background: `hsl(${210 + tempRatio * 50}deg, 80%, 60%)` }}
                />
              </div>

              {item.precipProb > 10 && (
                <div className="flex items-center gap-0.5 text-blue-300 text-xs">
                  <Droplets className="w-3 h-3" />
                  <span>{item.precipProb}%</span>
                </div>
              )}
              <div className="flex items-center gap-0.5 text-white/35 text-xs">
                <Wind className="w-3 h-3" />
                <span>{Math.round(item.wind)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
