import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  particleType: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog' | 'drizzle';
  isDay: number;
  timezone?: string;
}

type TimePeriod = 'night' | 'predawn' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'golden' | 'dusk';

function getLocalHour(timezone?: string): number {
  try {
    if (!timezone) return new Date().getHours();
    const str = new Date().toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
    const h = parseInt(str, 10);
    return isNaN(h) ? new Date().getHours() : h % 24;
  } catch {
    return new Date().getHours();
  }
}

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 21 || hour < 4)  return 'night';
  if (hour < 6)                return 'predawn';
  if (hour < 7.5)              return 'dawn';
  if (hour < 11)               return 'morning';
  if (hour < 14)               return 'midday';
  if (hour < 17)               return 'afternoon';
  if (hour < 19)               return 'golden';
  return 'dusk';
}

const TIME_GRADIENTS: Record<TimePeriod, string> = {
  night:     'linear-gradient(180deg, #020710 0%, #050d1e 35%, #080e20 65%, #0a1228 100%)',
  predawn:   'linear-gradient(180deg, #050a18 0%, #0d1035 30%, #2a1055 60%, #7c2d12 85%, #c2410c 100%)',
  dawn:      'linear-gradient(180deg, #1e1b4b 0%, #4338ca 18%, #7c3aed 35%, #db2777 55%, #f97316 75%, #fbbf24 100%)',
  morning:   'linear-gradient(180deg, #0369a1 0%, #0284c7 25%, #38bdf8 55%, #7dd3fc 80%, #bae6fd 100%)',
  midday:    'linear-gradient(180deg, #0284c7 0%, #38bdf8 30%, #7dd3fc 65%, #bae6fd 100%)',
  afternoon: 'linear-gradient(180deg, #1d4ed8 0%, #2563eb 30%, #60a5fa 65%, #93c5fd 100%)',
  golden:    'linear-gradient(180deg, #4c1d95 0%, #7c3aed 20%, #dc2626 45%, #f97316 65%, #fbbf24 85%, #fef9c3 100%)',
  dusk:      'linear-gradient(180deg, #1e1b4b 0%, #4c1d95 25%, #7c3aed 50%, #c2410c 80%, #431407 100%)',
};

const WEATHER_OVERLAYS: Record<string, string> = {
  clear:   'rgba(0,0,0,0)',
  cloudy:  'rgba(30,41,59,0.30)',
  fog:     'rgba(148,163,184,0.35)',
  drizzle: 'rgba(30,58,138,0.32)',
  rain:    'rgba(15,23,42,0.45)',
  storm:   'rgba(8,12,24,0.60)',
  snow:    'rgba(219,234,254,0.15)',
};

function getSunPosition(hour: number): { x: number; y: number } | null {
  if (hour < 5.5 || hour > 20.5) return null;
  const t = (hour - 5.5) / 15;
  const x = 8 + t * 84;
  const arc = Math.sin(t * Math.PI);
  const y = 6 + (1 - arc) * 38;
  return { x, y };
}

function StarField({ count = 120 }: { count?: number }) {
  const [stars] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 60,
      r: Math.random() * 1.4 + 0.4,
      delay: Math.random() * 4,
      dur: 2 + Math.random() * 3,
    }))
  );
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      {stars.map(s => (
        <motion.circle key={s.id}
          cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white"
          animate={{ opacity: [0.8, 0.15, 0.8] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  );
}

function MoonElement() {
  return (
    <motion.div
      className="absolute"
      style={{ top: '6%', right: '12%' }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 2 }}
    >
      <svg width="60" height="60" viewBox="0 0 60 60" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="moon-bg" cx="38%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>
          <filter id="moon-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Outer glow */}
        <motion.circle cx="30" cy="30" r="24" fill="rgba(226,232,240,0.08)"
          animate={{ r: [24, 27, 24] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Moon body */}
        <circle cx="30" cy="30" r="16" fill="url(#moon-bg)" filter="url(#moon-glow)" />
        {/* Crescent shadow */}
        <circle cx="37" cy="27" r="13" fill="#0a1420" />
        {/* Craters */}
        <circle cx="21" cy="26" r="2.5" fill="rgba(0,0,0,0.08)" />
        <circle cx="16" cy="33" r="1.8" fill="rgba(0,0,0,0.06)" />
      </svg>
    </motion.div>
  );
}

function SunElement({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <svg width="90" height="90" viewBox="0 0 90 90" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="sun-core" cx="42%" cy="35%" r="62%">
            <stop offset="0%" stopColor="#fffde7" />
            <stop offset="45%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <radialGradient id="sun-glow-r" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.4)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </radialGradient>
          <filter id="sun-blur">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Outer ambient glow */}
        <motion.circle cx="45" cy="45" r="42" fill="url(#sun-glow-r)"
          animate={{ r: [42, 46, 42] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Rotating rays */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '45px 45px' }}
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const r1 = 24, r2 = 36;
            const opacity = i % 2 === 0 ? 0.7 : 0.4;
            return (
              <line key={i}
                x1={45 + r1 * Math.cos(angle)} y1={45 + r1 * Math.sin(angle)}
                x2={45 + r2 * Math.cos(angle)} y2={45 + r2 * Math.sin(angle)}
                stroke="#fde68a" strokeWidth={i % 2 === 0 ? 2.5 : 1.5}
                strokeLinecap="round" opacity={opacity}
              />
            );
          })}
        </motion.g>
        {/* Sun disc */}
        <motion.circle cx="45" cy="45" r="20"
          fill="url(#sun-core)"
          filter="url(#sun-blur)"
          animate={{ r: [20, 21, 20] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Highlight */}
        <ellipse cx="38" cy="38" rx="7" ry="5" fill="rgba(255,255,255,0.3)" />
      </svg>
    </motion.div>
  );
}

export default function WeatherBackground({ particleType, isDay, timezone }: Props) {
  const [hour, setHour] = useState(() => getLocalHour(timezone));

  useEffect(() => {
    const update = () => setHour(getLocalHour(timezone));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [timezone]);

  const period = getTimePeriod(hour);
  const gradient = TIME_GRADIENTS[period];
  const overlay = WEATHER_OVERLAYS[particleType] || 'rgba(0,0,0,0)';
  const sunPos = getSunPosition(hour);
  const showNightSky = period === 'night' || period === 'predawn';
  const showMoon = showNightSky || period === 'dusk';
  const showSun = isDay === 1 && sunPos !== null && particleType !== 'storm';

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Time-based gradient */}
      <motion.div
        className="absolute inset-0 weather-bg-transition"
        style={{ background: gradient }}
        animate={{ background: gradient }}
        transition={{ duration: 3 }}
      />

      {/* Weather overlay */}
      <div className="absolute inset-0" style={{ background: overlay, transition: 'background 2s ease' }} />

      {/* Stars (night) */}
      <AnimatePresence>
        {showNightSky && (
          <motion.div className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <StarField count={particleType === 'clear' ? 140 : 60} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moon */}
      <AnimatePresence>
        {showMoon && <MoonElement />}
      </AnimatePresence>

      {/* Sun */}
      <AnimatePresence>
        {showSun && sunPos && <SunElement x={sunPos.x} y={sunPos.y} />}
      </AnimatePresence>

      {/* Horizon glow for dawn/dusk */}
      {(period === 'dawn' || period === 'golden' || period === 'dusk') && (
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background: period === 'dawn'
              ? 'linear-gradient(to top, rgba(251,146,60,0.35) 0%, transparent 100%)'
              : period === 'golden'
              ? 'linear-gradient(to top, rgba(251,191,36,0.4) 0%, transparent 100%)'
              : 'linear-gradient(to top, rgba(124,58,237,0.3) 0%, transparent 100%)',
          }}
        />
      )}

      {/* Floating clouds for cloudy/overcast */}
      {(particleType === 'cloudy' || particleType === 'fog') && (
        <div className="absolute inset-0 overflow-hidden">
          {[
            { top: '8%', left: '5%', w: 260, opacity: 0.18, dur: 22 },
            { top: '18%', left: '55%', w: 200, opacity: 0.13, dur: 28 },
            { top: '30%', left: '-5%', w: 320, opacity: 0.12, dur: 35 },
          ].map((c, i) => (
            <motion.div key={i}
              className="absolute rounded-full"
              style={{
                top: c.top, left: c.left,
                width: c.w, height: c.w * 0.38,
                background: 'radial-gradient(ellipse, rgba(203,213,225,0.9) 0%, transparent 70%)',
                opacity: c.opacity,
              }}
              animate={{ x: [0, 30, 0] }}
              transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* Rain overlay streaks */}
      {(particleType === 'rain' || particleType === 'drizzle') && (
        <div className="absolute top-0 left-0 right-0 h-40"
          style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.25) 0%, transparent 100%)' }}
        />
      )}

      {/* Storm lightning flash */}
      {particleType === 'storm' && (
        <motion.div className="absolute inset-0"
          animate={{ opacity: [0, 0, 0, 0.06, 0, 0.04, 0] }}
          transition={{ duration: 6, repeat: Infinity, times: [0, 0.6, 0.65, 0.67, 0.69, 0.72, 1] }}
          style={{ background: 'rgba(255,255,255,1)' }}
        />
      )}

      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
      />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px',
        }}
      />
    </div>
  );
}
