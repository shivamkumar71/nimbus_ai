import { motion } from "framer-motion";
import { Wind } from "lucide-react";
import { getAqiLabel } from "@/lib/weatherApi";
import type { AirQualityData } from "@/lib/weatherApi";

interface Props {
  data: AirQualityData;
}

export default function AirQualityCard({ data }: Props) {
  const { us_aqi, pm10, pm2_5, ozone, nitrogen_dioxide } = data.current;
  const aqiInfo = getAqiLabel(us_aqi);

  const pollutants = [
    { name: 'PM2.5', value: pm2_5, max: 150, unit: 'μg/m³', color: '#f472b6' },
    { name: 'PM10', value: pm10, max: 250, unit: 'μg/m³', color: '#fb923c' },
    { name: 'O₃', value: ozone, max: 180, unit: 'μg/m³', color: '#a78bfa' },
    { name: 'NO₂', value: nitrogen_dioxide, max: 100, unit: 'μg/m³', color: '#34d399' },
  ];

  const aqiPercent = Math.min((us_aqi / 300) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-air-quality"
    >
      <div className="flex items-center gap-2 mb-4">
        <Wind className="w-4 h-4 text-white/60" />
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">Air Quality</h3>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0"
          style={{ background: `${aqiInfo.color}20`, color: aqiInfo.color }}
        >
          {us_aqi}
        </div>
        <div>
          <div className="font-bold text-white text-base" style={{ color: aqiInfo.color }}>
            {aqiInfo.label}
          </div>
          <div className="text-white/50 text-xs mt-1">{aqiInfo.description}</div>
        </div>
      </div>

      {/* AQI bar */}
      <div className="mb-5">
        <div className="h-2 rounded-full overflow-hidden mb-1"
          style={{
            background: 'linear-gradient(90deg, #22c55e 0%, #eab308 33%, #f97316 50%, #ef4444 67%, #a855f7 83%, #7f1d1d 100%)',
          }}
        >
          <div
            className="relative"
            style={{ left: `${Math.max(0, Math.min(aqiPercent - 1, 99))}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-white shadow-lg -mt-0.5 border-2 border-white/20" style={{ marginLeft: '-6px' }} />
          </div>
        </div>
        <div className="flex justify-between text-white/30 text-xs mt-1">
          <span>0</span>
          <span>Good → Moderate → Unhealthy → Hazardous</span>
          <span>300+</span>
        </div>
      </div>

      {/* Pollutants */}
      <div className="grid grid-cols-2 gap-3">
        {pollutants.map(({ name, value, max, unit, color }) => (
          <div key={name} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-white/50 text-xs mb-1">{name}</div>
            <div className="font-bold text-sm mb-2" style={{ color }}>
              {value !== undefined ? value.toFixed(1) : '—'} <span className="font-normal text-xs text-white/30">{unit}</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
