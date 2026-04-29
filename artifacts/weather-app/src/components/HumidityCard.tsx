import { motion } from "framer-motion";
import { Droplets } from "lucide-react";

interface Props {
  humidity: number;
  dewPoint: number;
}

export default function HumidityCard({ humidity, dewPoint }: Props) {
  function getHumidityLabel(h: number): string {
    if (h < 30) return 'Very Dry';
    if (h < 50) return 'Comfortable';
    if (h < 70) return 'Moderate';
    if (h < 85) return 'Humid';
    return 'Very Humid';
  }

  const pct = humidity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.62 }}
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-humidity"
    >
      <div className="flex items-center gap-2 mb-4">
        <Droplets className="w-4 h-4 text-blue-400" />
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">Humidity</h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Radial */}
        <div className="relative flex-shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <motion.circle
              cx="40" cy="40" r="30"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${Math.PI * 2 * 30}`}
              initial={{ strokeDashoffset: Math.PI * 2 * 30 }}
              animate={{ strokeDashoffset: Math.PI * 2 * 30 * (1 - pct / 100) }}
              transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.6))' }}
            />
            <text x="40" y="45" textAnchor="middle" className="fill-white" style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>
              {pct}%
            </text>
          </svg>
        </div>

        <div className="flex-1">
          <div className="text-blue-400 font-semibold text-base">{getHumidityLabel(humidity)}</div>
          <div className="text-white/50 text-xs mt-2">
            Dew point <span className="text-white font-medium">{Math.round(dewPoint)}°C</span>
          </div>
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #93c5fd, #60a5fa, #3b82f6)' }}
            />
          </div>
          <div className="flex justify-between text-white/30 text-xs mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
