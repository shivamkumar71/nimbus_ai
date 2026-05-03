import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  particleType: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog' | 'drizzle';
  isDay: number;
  timezone?: string;
  sunrise?: string;  // e.g. "2026-05-03T05:34"
  sunset?: string;   // e.g. "2026-05-03T20:47"
}

type TimePeriod = 'night' | 'predawn' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'golden' | 'dusk';

function getLocalHour(timezone?: string): number {
  try {
    if (!timezone) return new Date().getHours() + new Date().getMinutes() / 60;
    const str = new Date().toLocaleString('en-US', {
      timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: false,
    });
    // "14:37" or "2:37"
    const [h, m] = str.split(':').map(Number);
    return (isNaN(h) ? new Date().getHours() : h % 24) + (isNaN(m) ? 0 : m / 60);
  } catch {
    return new Date().getHours() + new Date().getMinutes() / 60;
  }
}

// Parse "2026-05-03T05:34" → fractional hour (5.567)
function parseHour(timeStr?: string, fallback = 6): number {
  if (!timeStr) return fallback;
  const t = timeStr.split('T')[1];
  if (!t) return fallback;
  const [h, m] = t.split(':').map(Number);
  return (isNaN(h) ? fallback : h) + (isNaN(m) ? 0 : m / 60);
}

function getTimePeriod(hour: number, riseH: number, setH: number): TimePeriod {
  const dawn    = riseH - 1.5;
  const morning = riseH + 1.5;
  const midday  = (riseH + setH) / 2 - 1;
  const mid2    = (riseH + setH) / 2 + 1;
  const golden  = setH - 1.5;
  const dusk    = setH + 1;

  if (hour >= dusk || hour < dawn)   return 'night';
  if (hour < riseH)                  return hour < dawn + 0.5 ? 'predawn' : 'dawn';
  if (hour < morning)                return 'morning';
  if (hour < midday)                 return 'morning';
  if (hour < mid2)                   return 'midday';
  if (hour < golden)                 return 'afternoon';
  if (hour < setH)                   return 'golden';
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

// ── Sun arc: sunrise (left) → solar noon (top-centre) → sunset (right) ────────
// Peak at y≈14% so the sun sits in the visible sky gap above the weather card.
function getSunPosition(
  hour: number,
  riseH: number,
  setH: number,
): { x: number; y: number } | null {
  if (hour < riseH || hour > setH) return null;
  const dayLen = setH - riseH;
  const t = (hour - riseH) / dayLen; // 0 = sunrise, 1 = sunset
  const x = 6 + t * 88;
  // Peak (t=0.5) → y=14%;  horizon (t=0 or 1) → y=52%
  const y = 14 + (1 - Math.sin(t * Math.PI)) * 38;
  return { x, y };
}

// ── Moon arc: sunset (left) → midnight (top-centre) → sunrise (right) ─────────
// Mirror of sun: when sun sets right, moon rises left; when moon sets right, sun rises left
function getMoonPosition(
  hour: number,
  riseH: number,
  setH: number,
): { x: number; y: number } | null {
  const nightLen = 24 - setH + riseH; // hours of darkness
  let t: number;
  if (hour >= setH) {
    t = (hour - setH) / nightLen;
  } else if (hour < riseH) {
    t = (24 - setH + hour) / nightLen;
  } else {
    return null; // daytime
  }
  t = Math.max(0, Math.min(1, t));
  const x = 6 + t * 88;
  // Peak (t=0.5) → y=13%;  horizon (t=0 or 1) → y=45%
  const y = 13 + (1 - Math.sin(t * Math.PI)) * 32;
  return { x, y };
}

// ── Stars ─────────────────────────────────────────────────────────────────────
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
      initial={{ opacity: 0 }} animate={{ opacity }} exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
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

// ── Atmospheric night clouds ───────────────────────────────────────────────────
function NightClouds() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[
        { top: '10%', left: '-5%',  w: 380, opacity: 0.22, dur: 42 },
        { top: '22%', left: '28%',  w: 300, opacity: 0.16, dur: 55 },
        { top: '7%',  left: '58%',  w: 260, opacity: 0.14, dur: 38 },
        { top: '30%', left: '-10%', w: 420, opacity: 0.10, dur: 62 },
      ].map((c, i) => (
        <motion.div key={i}
          className="absolute"
          style={{
            top: c.top, left: c.left,
            width: c.w, height: c.w * 0.32,
            background: 'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(90,120,200,0.55) 0%, rgba(50,70,150,0.25) 55%, transparent 100%)',
            opacity: c.opacity,
            filter: 'blur(20px)',
            borderRadius: '50%',
          }}
          animate={{ x: [0, 35, 0] }}
          transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 3 }}
        />
      ))}
    </div>
  );
}

// ── Moon (large, glowing crescent — uses mask so no black shapes) ─────────────
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
          <radialGradient id="moon-surf" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#f8fafc" />
            <stop offset="50%"  stopColor="#dde4ef" />
            <stop offset="100%" stopColor="#8fa0b8" />
          </radialGradient>
          <radialGradient id="moon-halo-r" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(220,230,245,0.22)" />
            <stop offset="55%"  stopColor="rgba(148,163,184,0.07)" />
            <stop offset="100%" stopColor="rgba(148,163,184,0)" />
          </radialGradient>
          <radialGradient id="moon-outer-r" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          {/* Mask punches crescent hole — background sky shows through, no black */}
          <mask id="moon-crescent-mask">
            <circle cx="50" cy="50" r="29" fill="white" />
            <circle cx="62" cy="45" r="23" fill="black" />
          </mask>
          <filter id="moon-f">
            <feGaussianBlur stdDeviation="1" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Wide ambient glow */}
        <motion.circle cx="50" cy="50" r="72" fill="url(#moon-outer-r)"
          animate={{ r: [72, 78, 72] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />

        {/* Inner halo */}
        <motion.circle cx="50" cy="50" r="46" fill="url(#moon-halo-r)"
          animate={{ r: [46, 51, 46] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />

        {/* Moon disc — crescent shape via mask (sky shows through, no black circle) */}
        <circle
          cx="50" cy="50" r="29"
          fill="url(#moon-surf)"
          mask="url(#moon-crescent-mask)"
          filter="url(#moon-f)"
        />

        {/* Soft highlight on the lit edge */}
        <ellipse cx="36" cy="38" rx="7" ry="4.5"
          fill="rgba(255,255,255,0.22)"
          mask="url(#moon-crescent-mask)"
        />
      </svg>
    </motion.div>
  );
}

// ── Sun (warm, rotating rays) ──────────────────────────────────────────────────
function SunElement({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 1.5 }}
    >
      <svg width="90" height="90" viewBox="0 0 90 90" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="sun-core-r" cx="42%" cy="35%" r="62%">
            <stop offset="0%" stopColor="#fffde7" />
            <stop offset="45%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <radialGradient id="sun-amb-r" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(251,191,36,0.35)" />
            <stop offset="60%"  stopColor="rgba(251,191,36,0.08)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </radialGradient>
          <filter id="sun-f">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <motion.circle cx="45" cy="45" r="44" fill="url(#sun-amb-r)"
          animate={{ r: [44, 48, 44] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '45px 45px' }}
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const r2 = i % 2 === 0 ? 38 : 33;
            return (
              <line key={i}
                x1={45 + 24 * Math.cos(a)} y1={45 + 24 * Math.sin(a)}
                x2={45 + r2 * Math.cos(a)} y2={45 + r2 * Math.sin(a)}
                stroke="#fde68a" strokeWidth={i % 2 === 0 ? 2.5 : 1.5}
                strokeLinecap="round" opacity={i % 2 === 0 ? 0.8 : 0.45}
              />
            );
          })}
        </motion.g>
        <motion.circle cx="45" cy="45" r="20" fill="url(#sun-core-r)" filter="url(#sun-f)"
          animate={{ r: [20, 21.5, 20] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        <ellipse cx="38" cy="38" rx="7" ry="5" fill="rgba(255,255,255,0.3)" />
      </svg>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function WeatherBackground({ particleType, isDay, timezone, sunrise, sunset }: Props) {
  const [hour, setHour] = useState(() => getLocalHour(timezone));

  useEffect(() => {
    const update = () => setHour(getLocalHour(timezone));
    update();
    const id = setInterval(update, 30000); // refresh every 30s for smooth tracking
    return () => clearInterval(id);
  }, [timezone]);

  // Use actual sunrise/sunset from API, fallback to sensible defaults
  const riseH = parseHour(sunrise, 6.0);
  const setH  = parseHour(sunset, 20.0);

  const period   = getTimePeriod(hour, riseH, setH);
  const gradient = TIME_GRADIENTS[period];
  const overlay  = WEATHER_OVERLAYS[particleType] ?? 'rgba(0,0,0,0)';
  const sunPos   = getSunPosition(hour, riseH, setH);
  const moonPos  = getMoonPosition(hour, riseH, setH);
  const isNight  = period === 'night' || period === 'predawn';
  const showSun  = sunPos !== null && particleType !== 'storm';
  const showMoon = moonPos !== null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">

      {/* Time-based sky gradient */}
      <div className="absolute inset-0" style={{ background: gradient, transition: 'background 4s ease' }} />

      {/* Weather overlay */}
      <div className="absolute inset-0" style={{ background: overlay, transition: 'background 2s ease' }} />

      {/* Stars — only at night */}
      <AnimatePresence>
        {isNight && (
          <StarField opacity={particleType === 'storm' ? 0 : particleType === 'clear' ? 0.95 : 0.5} />
        )}
      </AnimatePresence>

      {/* Atmospheric night clouds */}
      <AnimatePresence>
        {(isNight || period === 'dusk') && (
          <motion.div className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
          >
            <NightClouds />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOON: rises left at sunset, sets right at sunrise (continuous loop) ── */}
      <AnimatePresence>
        {showMoon && <MoonElement key="moon" x={moonPos!.x} y={moonPos!.y} />}
      </AnimatePresence>

      {/* ── SUN: rises left at sunrise, sets right at sunset (continuous loop) ── */}
      <AnimatePresence>
        {showSun && sunPos && <SunElement key="sun" x={sunPos.x} y={sunPos.y} />}
      </AnimatePresence>

      {/* Horizon glow (dawn / golden / dusk) */}
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

      {/* Day clouds (cloudy / fog) */}
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

      {/* Rain cap */}
      {(particleType === 'rain' || particleType === 'drizzle') && (
        <div className="absolute top-0 left-0 right-0 h-48"
          style={{ background: 'linear-gradient(180deg, rgba(30,64,175,0.28) 0%, transparent 100%)' }}
        />
      )}

      {/* Storm lightning flash */}
      {particleType === 'storm' && (
        <motion.div className="absolute inset-0"
          animate={{ opacity: [0, 0, 0, 0.08, 0, 0.04, 0] }}
          transition={{ duration: 6, repeat: Infinity, times: [0, 0.6, 0.65, 0.67, 0.69, 0.72, 1] }}
          style={{ background: 'rgba(255,255,255,1)' }}
        />
      )}

      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)' }}
      />

      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px',
        }}
      />
    </div>
  );
}
