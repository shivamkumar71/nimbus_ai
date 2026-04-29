import { motion } from "framer-motion";
import { Sunrise, Sunset, Clock } from "lucide-react";

interface Props {
  sunrise: string;
  sunset: string;
  timezone: string;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getDayProgress(sunrise: string, sunset: string): number {
  const now = Date.now();
  const sr = new Date(sunrise).getTime();
  const ss = new Date(sunset).getTime();
  if (now < sr) return 0;
  if (now > ss) return 100;
  return ((now - sr) / (ss - sr)) * 100;
}

function getDayLength(sunrise: string, sunset: string): string {
  const sr = new Date(sunrise).getTime();
  const ss = new Date(sunset).getTime();
  const diff = ss - sr;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function SunriseSunsetCard({ sunrise, sunset }: Props) {
  const progress = getDayProgress(sunrise, sunset);
  const dayLen = getDayLength(sunrise, sunset);

  // Sun arc path
  const W = 200, H = 100;
  const rx = W * 0.42, ry = H * 0.85;
  const cx = W / 2, cy = H + 5;

  function polarToXY(pct: number) {
    const angle = Math.PI + pct * Math.PI; // 180° to 360°
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  }

  const sunPos = polarToXY(progress / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.58 }}
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-sunrise-sunset"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sunrise className="w-4 h-4 text-orange-400" />
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">Sunrise & Sunset</h3>
      </div>

      {/* Arc visualization */}
      <div className="flex justify-center mb-4">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: '220px' }}>
          {/* Background arc */}
          <path
            d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Progress arc */}
          {progress > 0 && (
            <motion.path
              d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${sunPos.x} ${sunPos.y}`}
              fill="none"
              stroke="url(#sunGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            />
          )}

          {/* Sun position */}
          <motion.circle
            cx={sunPos.x}
            cy={sunPos.y}
            r="5"
            fill="#fbbf24"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.75, type: 'spring' }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))' }}
          />

          {/* Horizon dots */}
          <circle cx={cx - rx} cy={cy} r="3" fill="rgba(251,191,36,0.5)" />
          <circle cx={cx + rx} cy={cy} r="3" fill="rgba(251,191,36,0.5)" />

          <defs>
            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-2xl" style={{ background: 'rgba(251,191,36,0.08)' }}>
          <Sunrise className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-white font-bold text-sm">{fmtTime(sunrise)}</div>
          <div className="text-white/40 text-xs">Sunrise</div>
        </div>
        <div className="text-center p-3 rounded-2xl" style={{ background: 'rgba(251,191,36,0.08)' }}>
          <Sunset className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <div className="text-white font-bold text-sm">{fmtTime(sunset)}</div>
          <div className="text-white/40 text-xs">Sunset</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-3 text-white/40 text-xs">
        <Clock className="w-3.5 h-3.5" />
        <span>Day length: {dayLen}</span>
      </div>
    </motion.div>
  );
}
