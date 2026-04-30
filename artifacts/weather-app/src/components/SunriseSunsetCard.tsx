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
  if (now > ss) return 1;
  return (now - sr) / (ss - sr);
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
  const isDay = progress > 0 && progress < 1;

  const W = 240, H = 110;
  const rx = W * 0.43, ry = H * 0.88;
  const cx = W / 2, cy = H + 4;

  function polarToXY(pct: number) {
    const angle = Math.PI + pct * Math.PI;
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  }

  const sunPos = polarToXY(progress);
  const srPos = polarToXY(0);
  const ssPos = polarToXY(1);

  const progressArcEnd = polarToXY(Math.min(progress, 0.999));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.58 }}
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-sunrise-sunset"
    >
      {/* Warm ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(ellipse, #fbbf24 0%, transparent 70%)', top: '-20px' }}
      />

      <div className="flex items-center gap-2 mb-3">
        <Sunrise className="w-4 h-4 text-orange-400" />
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">Sunrise & Sunset</h3>
      </div>

      {/* Arc visualization */}
      <div className="flex justify-center mb-3">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: '260px', overflow: 'visible' }}>
          <defs>
            <linearGradient id="sunArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.6" />
            </linearGradient>
            <filter id="sunGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="sunPulseGlow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="skyGrad" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="rgba(251,191,36,0.12)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Sky glow under arc */}
          <ellipse cx={W / 2} cy={H} rx={rx + 20} ry={30} fill="url(#skyGrad)" />

          {/* Horizon line */}
          <line
            x1={cx - rx - 10} y1={cy}
            x2={cx + rx + 10} y2={cy}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />

          {/* Background arc (full) */}
          <path
            d={`M ${srPos.x} ${srPos.y} A ${rx} ${ry} 0 0 1 ${ssPos.x} ${ssPos.y}`}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Progress arc */}
          {progress > 0.01 && (
            <motion.path
              d={`M ${srPos.x} ${srPos.y} A ${rx} ${ry} 0 0 1 ${progressArcEnd.x} ${progressArcEnd.y}`}
              fill="none"
              stroke="url(#sunArcGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            />
          )}

          {/* Sunrise dot */}
          <circle cx={srPos.x} cy={srPos.y} r="4" fill="rgba(249,115,22,0.6)" />
          <circle cx={srPos.x} cy={srPos.y} r="2.5" fill="#f97316" />

          {/* Sunset dot */}
          <circle cx={ssPos.x} cy={ssPos.y} r="4" fill="rgba(251,146,60,0.4)" />
          <circle cx={ssPos.x} cy={ssPos.y} r="2.5" fill="#fb923c" />

          {/* ── Blinking Sun ── */}
          {isDay && (
            <g filter="url(#sunPulseGlow)">
              {/* Outer pulse ring 1 */}
              <motion.circle
                cx={sunPos.x}
                cy={sunPos.y}
                r="14"
                fill="none"
                stroke="rgba(251,191,36,0.35)"
                strokeWidth="1"
                initial={{ r: 8, opacity: 0.6 }}
                animate={{ r: [8, 18, 8], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Outer pulse ring 2 (offset) */}
              <motion.circle
                cx={sunPos.x}
                cy={sunPos.y}
                r="10"
                fill="none"
                stroke="rgba(251,191,36,0.5)"
                strokeWidth="1.5"
                initial={{ r: 6, opacity: 0.7 }}
                animate={{ r: [6, 14, 6], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
              />
              {/* Sun rays (8 rays, rotating slowly) */}
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${sunPos.x}px ${sunPos.y}px` }}
              >
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const r1 = 8, r2 = 13;
                  const x1 = sunPos.x + r1 * Math.cos(angle);
                  const y1 = sunPos.y + r1 * Math.sin(angle);
                  const x2 = sunPos.x + r2 * Math.cos(angle);
                  const y2 = sunPos.y + r2 * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1} y1={y1}
                      x2={x2} y2={y2}
                      stroke="rgba(251,191,36,0.55)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  );
                })}
              </motion.g>
              {/* Inner glow halo */}
              <circle
                cx={sunPos.x}
                cy={sunPos.y}
                r="7"
                fill="rgba(251,191,36,0.25)"
              />
              {/* Sun core */}
              <motion.circle
                cx={sunPos.x}
                cy={sunPos.y}
                r="5"
                fill="#fde68a"
                animate={{ opacity: [1, 0.75, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,1))' }}
              />
              {/* Bright center */}
              <circle
                cx={sunPos.x}
                cy={sunPos.y}
                r="2.5"
                fill="white"
                opacity={0.9}
              />
            </g>
          )}

          {/* Night / pre-dawn moon indicator */}
          {!isDay && (
            <motion.text
              x={cx}
              y={H * 0.45}
              textAnchor="middle"
              fontSize="20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              🌙
            </motion.text>
          )}
        </svg>
      </div>

      {/* Sunrise / Sunset times */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-2xl" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
          <Sunrise className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <div className="text-white font-bold text-sm">{fmtTime(sunrise)}</div>
          <div className="text-white/40 text-xs">Sunrise</div>
        </div>
        <div className="text-center p-3 rounded-2xl" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}>
          <Sunset className="w-4 h-4 text-orange-500 mx-auto mb-1" />
          <div className="text-white font-bold text-sm">{fmtTime(sunset)}</div>
          <div className="text-white/40 text-xs">Sunset</div>
        </div>
      </div>

      {/* Day length */}
      <div className="flex items-center justify-center gap-2 mt-3 text-white/35 text-xs">
        <Clock className="w-3.5 h-3.5" />
        <span>Day length: <span className="text-white/55 font-medium">{dayLen}</span></span>
      </div>

      {/* Live daylight progress bar */}
      {isDay && (
        <div className="mt-3">
          <div className="flex justify-between text-white/30 text-xs mb-1.5">
            <span>Daylight progress</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #f97316, #fbbf24, #fb923c)' }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
