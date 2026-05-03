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
  night:     'linear-gradient(180deg, #020710 0%, #040c1c 40%, #060e22 70%, #0a1228 100%)',
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
  cloudy:  'rgba(30,41,59,0.28)',
  fog:     'rgba(148,163,184,0.35)',
  drizzle: 'rgba(30,58,138,0.32)',
  rain:    'rgba(15,23,42,0.45)',
  storm:   'rgba(8,12,24,0.60)',
  snow:    'rgba(219,234,254,0.12)',
};

// Sun arc: rises left at 6 AM, peaks center at noon, sets right at 8 PM
function getSunPosition(hour: number): { x: number; y: number } | null {
  if (hour < 5.5 || hour > 20.5) return null;
  const t = (hour - 5.5) / 15;
  const x = 6 + t * 88;
  const arc = Math.sin(t * Math.PI);
  const y = 5 + (1 - arc) * 40;
  return { x, y };
}

// Moon arc: rises left at 8 PM, peaks center at midnight, sets right at 5 AM
function getMoonPosition(hour: number): { x: number; y: number } | null {
  let progress: number;
  if (hour >= 20)       progress = (hour - 20) / 9;      // 8 PM → midnight part
  else if (hour < 5)    progress = (hour + 4) / 9;        // midnight → 5 AM part
  else                  return null;                       // daytime, no moon

  const x = 6 + progress * 86;
  const arc = Math.sin(progress * Math.PI);
  const y = 4 + (1 - arc) * 32;
  return { x, y };
}

// ── Star field ────────────────────────────────────────────────────────────────
function StarField({ opacity = 1 }: { opacity?: number }) {
  const [stars] = useState(() =>
    Array.from({ length: 160 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 70,
      r: Math.random() * 1.6 + 0.3,
      delay: Math.random() * 5,
      dur: 1.5 + Math.random() * 3.5,
    }))
  );
  return (
    <motion.div className="absolute inset-0"
      initial={{ opacity: 0 }} animate={{ opacity }} transition={{ duration: 2 }}
    >
      <svg className="w-full h-full" style={{ pointerEvents: 'none' }}>
        {stars.map(s => (
          <motion.circle key={s.id}
            cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white"
            animate={{ opacity: [0.9, 0.15, 0.9] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

// ── Night cloud layer (wispy, atmospheric, like the reference image) ───────────
function NightClouds() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[
        { top: '12%', left: '-5%', w: 380, h: 90, opacity: 0.22, dur: 40, delay: 0 },
        { top: '22%', left: '30%', w: 300, h: 70, opacity: 0.16, dur: 52, delay: 8 },
        { top: '8%',  left: '55%', w: 260, h: 60, opacity: 0.14, dur: 38, delay: 4 },
        { top: '32%', left: '-10%',w: 420, h: 80, opacity: 0.10, dur: 60, delay: 12 },
      ].map((c, i) => (
        <motion.div key={i}
          className="absolute"
          style={{
            top: c.top, left: c.left,
            width: c.w, height: c.h,
            background: 'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(100,130,200,0.6) 0%, rgba(60,80,160,0.3) 50%, transparent 100%)',
            opacity: c.opacity,
            filter: 'blur(18px)',
            borderRadius: '50%',
          }}
          animate={{ x: [0, 40, 0] }}
          transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
        />
      ))}
    </div>
  );
}

// ── Moon element (large, glowing, arcs across sky) ────────────────────────────
function MoonElement({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 2.5, ease: 'easeOut' }}
    >
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="moon-surface" cx="38%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>
          <radialGradient id="moon-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(226,232,240,0.25)" />
            <stop offset="50%"  stopColor="rgba(148,163,184,0.08)" />
            <stop offset="100%" stopColor="rgba(148,163,184,0)" />
          </radialGradient>
          <radialGradient id="moon-glow-outer" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter id="moon-soft">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Wide atmospheric halo */}
        <motion.circle cx="50" cy="50" r="70" fill="url(#moon-glow-outer)"
          animate={{ r: [70, 76, 70] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Inner halo */}
        <motion.circle cx="50" cy="50" r="46" fill="url(#moon-halo)"
          animate={{ r: [46, 50, 46] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Moon disc */}
        <circle cx="50" cy="50" r="28" fill="url(#moon-surface)" filter="url(#moon-soft)" />
        {/* Crescent shadow (dark circle offset to create crescent) */}
        <circle cx="60" cy="45" r="22" fill="#0d1420" />
        {/* Crater details */}
        <circle cx="34" cy="44" r="3.5" fill="rgba(0,0,0,0.09)" />
        <circle cx="28" cy="55" r="2.2" fill="rgba(0,0,0,0.07)" />
        <circle cx="40" cy="60" r="2.8" fill="rgba(0,0,0,0.06)" />
        {/* Surface highlight */}
        <ellipse cx="38" cy="40" rx="7" ry="5" fill="rgba(255,255,255,0.18)" />
      </svg>
    </motion.div>
  );
}

// ── Sun element (arcs across sky left → center top → right) ──────────────────
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
          <radialGradient id="sun-ambient" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(251,191,36,0.35)" />
            <stop offset="60%"  stopColor="rgba(251,191,36,0.08)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </radialGradient>
          <filter id="sun-glow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Ambient glow */}
        <motion.circle cx="45" cy="45" r="44" fill="url(#sun-ambient)"
          animate={{ r: [44, 48, 44] }}
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
            const r1 = 24, r2 = i % 2 === 0 ? 38 : 33;
            return (
              <line key={i}
                x1={45 + r1 * Math.cos(angle)} y1={45 + r1 * Math.sin(angle)}
                x2={45 + r2 * Math.cos(angle)} y2={45 + r2 * Math.sin(angle)}
                stroke="#fde68a" strokeWidth={i % 2 === 0 ? 2.5 : 1.5}
                strokeLinecap="round" opacity={i % 2 === 0 ? 0.75 : 0.45}
              />
            );
          })}
        </motion.g>
        {/* Disc */}
        <motion.circle cx="45" cy="45" r="20" fill="url(#sun-core)" filter="url(#sun-glow)"
          animate={{ r: [20, 21.5, 20] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <ellipse cx="38" cy="38" rx="7" ry="5" fill="rgba(255,255,255,0.3)" />
      </svg>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WeatherBackground({ particleType, isDay, timezone }: Props) {
  const [hour, setHour] = useState(() => getLocalHour(timezone));

  useEffect(() => {
    const update = () => setHour(getLocalHour(timezone));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [timezone]);

  const period     = getTimePeriod(hour);
  const gradient   = TIME_GRADIENTS[period];
  const overlay    = WEATHER_OVERLAYS[particleType] ?? 'rgba(0,0,0,0)';
  const sunPos     = getSunPosition(hour);
  const moonPos    = getMoonPosition(hour);
  const isNight    = period === 'night' || period === 'predawn';
  const isDusk     = period === 'dusk';
  const showStars  = isNight;
  const showMoon   = moonPos !== null;
  const showSun    = isDay === 1 && sunPos !== null && particleType !== 'storm';

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">

      {/* Time-based sky gradient */}
      <motion.div
        className="absolute inset-0"
        style={{ background: gradient, transition: 'background 4s ease' }}
      />

      {/* Weather condition overlay */}
      <div className="absolute inset-0"
        style={{ background: overlay, transition: 'background 2s ease' }}
      />

      {/* Stars (night / predawn only) */}
      <AnimatePresence>
        {showStars && (
          <StarField opacity={particleType === 'clear' ? 0.95 : 0.45} />
        )}
      </AnimatePresence>

      {/* Night atmospheric clouds */}
      <AnimatePresence>
        {(isNight || isDusk) && (
          <motion.div className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
          >
            <NightClouds />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moon (arcs left → center → right during night hours) */}
      <AnimatePresence>
        {showMoon && <MoonElement x={moonPos!.x} y={moonPos!.y} />}
      </AnimatePresence>

      {/* Sun (arcs left → center → right during day hours) */}
      <AnimatePresence>
        {showSun && sunPos && <SunElement x={sunPos.x} y={sunPos.y} />}
      </AnimatePresence>

      {/* Horizon glow (dawn / golden hour / dusk) */}
      {(period === 'dawn' || period === 'golden' || period === 'dusk') && (
        <div className="absolute bottom-0 left-0 right-0 h-52 pointer-events-none"
          style={{
            background: period === 'dawn'
              ? 'linear-gradient(to top, rgba(249,115,22,0.4) 0%, transparent 100%)'
              : period === 'golden'
              ? 'linear-gradient(to top, rgba(251,191,36,0.45) 0%, transparent 100%)'
              : 'linear-gradient(to top, rgba(124,58,237,0.35) 0%, transparent 100%)',
          }}
        />
      )}

      {/* Day cloud layers (cloudy / fog) */}
      {(particleType === 'cloudy' || particleType === 'fog') && !isNight && (
        <div className="absolute inset-0 overflow-hidden">
          {[
            { top: '8%',  left: '5%',   w: 280, opacity: 0.18, dur: 22 },
            { top: '18%', left: '55%',  w: 220, opacity: 0.13, dur: 30 },
            { top: '28%', left: '-5%',  w: 340, opacity: 0.11, dur: 38 },
          ].map((c, i) => (
            <motion.div key={i}
              className="absolute rounded-full"
              style={{
                top: c.top, left: c.left,
                width: c.w, height: c.w * 0.36,
                background: 'radial-gradient(ellipse, rgba(203,213,225,0.9) 0%, transparent 70%)',
                opacity: c.opacity,
              }}
              animate={{ x: [0, 30, 0] }}
              transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* Rain blue cap overlay */}
      {(particleType === 'rain' || particleType === 'drizzle') && (
        <div className="absolute top-0 left-0 right-0 h-48"
          style={{ background: 'linear-gradient(180deg, rgba(30,64,175,0.28) 0%, transparent 100%)' }}
        />
      )}

      {/* Storm lightning flash */}
      {particleType === 'storm' && (
        <motion.div className="absolute inset-0"
          animate={{ opacity: [0, 0, 0, 0.07, 0, 0.04, 0] }}
          transition={{ duration: 6, repeat: Infinity, times: [0, 0.6, 0.65, 0.67, 0.69, 0.72, 1] }}
          style={{ background: 'rgba(255,255,255,1)' }}
        />
      )}

      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)' }}
      />

      {/* Film grain / noise */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px',
        }}
      />
    </div>
  );
}
