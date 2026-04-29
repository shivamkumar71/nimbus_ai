import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Droplets, Wind } from "lucide-react";
import { getWeatherDescription, formatHour } from "@/lib/weatherApi";

interface HourlyItem {
  time: string;
  temp: number;
  code: number;
  precipProb: number;
  wind: number;
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
          <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all" data-testid="button-scroll-left">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all" data-testid="button-scroll-right">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 px-5 pb-5 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, i) => {
          const desc = getWeatherDescription(item.code);
          const tempRatio = maxTemp !== minTemp ? (item.temp - minTemp) / (maxTemp - minTemp) : 0.5;
          const isNow = i === 0;
          return (
            <motion.div
              key={item.time}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.03 }}
              className={`flex-shrink-0 flex flex-col items-center gap-2.5 px-4 py-4 rounded-2xl cursor-default transition-all hover:bg-white/10 ${isNow ? 'ring-1 ring-blue-400/50' : ''}`}
              style={{
                background: isNow ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                minWidth: '80px',
              }}
              data-testid={`hourly-item-${i}`}
            >
              <div className="text-white/60 text-xs font-medium">
                {isNow ? 'Now' : formatHour(item.time)}
              </div>
              <div className="text-2xl">{desc.icon}</div>
              <div
                className="font-bold text-base"
                style={{
                  color: `hsl(${210 + tempRatio * 30}, ${60 + tempRatio * 40}%, ${55 + tempRatio * 25}%)`,
                }}
              >
                {Math.round(item.temp)}°
              </div>

              {/* Mini temp bar */}
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${tempRatio * 100}%`,
                    background: `hsl(${210 + tempRatio * 50}deg, 80%, 60%)`,
                  }}
                />
              </div>

              {item.precipProb > 10 && (
                <div className="flex items-center gap-1 text-blue-300 text-xs">
                  <Droplets className="w-3 h-3" />
                  <span>{item.precipProb}%</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-white/40 text-xs">
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
