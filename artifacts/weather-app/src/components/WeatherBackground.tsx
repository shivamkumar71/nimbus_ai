import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  particleType: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog' | 'drizzle';
  isDay: number;
  timezone?: string;
  sunrise?: string;
  sunset?: string;
}

type TimePeriod = 'night' | 'predawn' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'golden' | 'dusk';

function getLocalHour(timezone?: string): number {
  try {
    if (!timezone) return new Date().getHours() + new Date().getMinutes() / 60;
    const str = new Date().toLocaleString('en-US', {
      timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: false,
    });
    const [h, m] = str.split(':').map(Number);
    return (isNaN(h) ? new Date().getHours() : h % 24) + (isNaN(m) ? 0 : m / 60);
  } catch {
    return new Date().getHours() + new Date().getMinutes() / 60;
  }
}

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
  cloudy:  'rgba(30,41,59,0.18)',
  fog:     'rgba(148,163,184,0.3)',
  drizzle: 'rgba(30,58,138,0.28)',
  rain:    'rgba(15,23,42,0.40)',
  storm:   'rgba(8,12,24,0.65)',
  snow:    'rgba(219,234,254,0.10)',
};

function getSunPosition(hour: number, riseH: number, setH: number): { x: number; y: number } | null {
  if (hour < riseH || hour > setH) return null;
  const dayLen = setH - riseH;
  const t = (hour - riseH) / dayLen;
  const x = 6 + t * 88;
  const y = 14 + (1 - Math.sin(t * Math.PI)) * 38;
  return { x, y };
}

function getMoonPosition(hour: number, riseH: number, setH: number): { x: number; y: number } | null {
  const nightLen = 24 - setH + riseH;
  let t: number;
  if (hour >= setH) {
    t = (hour - setH) / nightLen;
  } else if (hour < riseH) {
    t = (24 - setH + hour) / nightLen;
  } else {
    return null;
  }
  t = Math.max(0, Math.min(1, t));
  const x = 6 + t * 88;
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

// ── Shooting / Falling Stars ───────────────────────────────────────────────────
function ShootingStars() {
  const meteors = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    startX: 10 + Math.random() * 70,
    startY: 2 + Math.random() * 30,
    length: 120 + Math.random() * 180,
    angle: 25 + Math.random() * 20,
    delay: i * 1.8 + Math.random() * 3,
    dur: 0.7 + Math.random() * 0.5,
    interval: 5 + Math.random() * 8,
    opacity: 0.7 + Math.random() * 0.3,
    width: 1.5 + Math.random() * 1.5,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {meteors.map(m => {
        const rad = (m.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * m.length;
        const dy = Math.sin(rad) * m.length;
        return (
          <motion.div
            key={m.id}
            className="absolute"
            style={{
              left: `${m.startX}%`,
              top: `${m.startY}%`,
              width: m.length,
              height: m.width + 2,
              transformOrigin: '0% 50%',
              rotate: m.angle,
            }}
            initial={{ scaleX: 0, opacity: 0, x: 0, y: 0 }}
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, m.opacity, 0],
              x: [0, dx * 0.3],
              y: [0, dy * 0.3],
            }}
            transition={{
              duration: m.dur,
              delay: m.delay,
              repeat: Infinity,
              repeatDelay: m.interval,
              ease: ['easeIn', 'easeOut'],
            }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 40%, rgba(200,220,255,1) 100%)`,
              borderRadius: m.width,
              boxShadow: `0 0 ${m.width * 2}px rgba(200,220,255,0.8)`,
            }} />
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Realistic Cloud Shape ──────────────────────────────────────────────────────
function CloudShape({
  dark = false, thin = false, opacity = 1, scale = 1,
}: {
  dark?: boolean; thin?: boolean; opacity?: number; scale?: number;
}) {
  const base  = dark  ? [30, 41, 59]   : [240, 248, 255];
  const mid   = dark  ? [44, 58, 78]   : [220, 235, 250];
  const light = dark  ? [55, 75, 100]  : [255, 255, 255];
  const shadow = dark ? [15, 25, 40]   : [190, 210, 240];
  const c = (rgb: number[], a = 1) => `rgba(${rgb.join(',')},${a})`;

  return (
    <svg
      viewBox="0 0 320 120"
      width={320 * scale}
      height={120 * scale}
      style={{ overflow: 'visible', opacity }}
    >
      <defs>
        <filter id={`cloud-blur-${dark ? 'd' : 'l'}-${thin ? 't' : 'f'}`}>
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        <radialGradient id={`cloud-grad-${dark ? 'd' : 'l'}`} cx="45%" cy="35%" r="60%">
          <stop offset="0%"   stopColor={c(light)} />
          <stop offset="50%"  stopColor={c(mid)} />
          <stop offset="100%" stopColor={c(base)} />
        </radialGradient>
      </defs>

      {/* Shadow base */}
      <ellipse cx="160" cy="108" rx="130" ry={thin ? 10 : 14}
        fill={c(shadow, 0.25)}
        filter={`url(#cloud-blur-${dark ? 'd' : 'l'}-${thin ? 't' : 'f'})`}
      />

      {/* Main cloud body */}
      <ellipse cx="160" cy={thin ? 82 : 85} rx="130" ry={thin ? 22 : 28}
        fill={`url(#cloud-grad-${dark ? 'd' : 'l'})`}
      />

      {/* Puffs */}
      {!thin && <>
        <circle cx="80"  cy="72" r="32" fill={c(mid)} />
        <circle cx="112" cy="58" r="40" fill={c(mid)} />
        <circle cx="160" cy="50" r="48" fill={c(light)} />
        <circle cx="208" cy="58" r="38" fill={c(mid)} />
        <circle cx="240" cy="68" r="30" fill={c(mid)} />
        {/* Top highlight */}
        <circle cx="150" cy="44" r="22" fill={c(light, 0.85)} />
        <ellipse cx="128" cy="54" rx="18" ry="12" fill={c(light, 0.6)} />
      </>}
      {thin && <>
        <circle cx="90"  cy="76" r="22" fill={c(mid)} />
        <circle cx="140" cy="68" r="28" fill={c(light)} />
        <circle cx="200" cy="72" r="24" fill={c(mid)} />
        <circle cx="250" cy="78" r="18" fill={c(mid)} />
        <ellipse cx="138" cy="64" rx="14" ry="8" fill={c(light, 0.7)} />
      </>}
    </svg>
  );
}

// ── Drifting Day Clouds ────────────────────────────────────────────────────────
function DriftingClouds({
  count = 5, dark = false, dense = false,
}: {
  count?: number; dark?: boolean; dense?: boolean;
}) {
  const clouds = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: -30 + (i / count) * 120,
    y: dense ? 2 + (i % 3) * 8 : 4 + (i % 4) * 10,
    scale: 0.55 + (i % 3) * 0.25,
    opacity: dense ? 0.82 + (i % 2) * 0.1 : 0.7 + (i % 3) * 0.1,
    speed: 60 + i * 20 + Math.random() * 40,
    thin: i % 3 === 0,
    layer: i % 2,
  })), [count, dark, dense]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map(c => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{ top: `${c.y}%`, zIndex: c.layer }}
          initial={{ x: `${c.startX}vw` }}
          animate={{ x: '120vw' }}
          transition={{
            duration: c.speed,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
            delay: -(c.startX / 120) * c.speed,
          }}
        >
          <CloudShape dark={dark} thin={c.thin} opacity={c.opacity} scale={c.scale} />
        </motion.div>
      ))}
    </div>
  );
}

// ── Storm Clouds (dark, thick coverage) ───────────────────────────────────────
function StormClouds() {
  const clouds = useMemo(() => [
    { id: 0, y: -2,  scale: 1.4, opacity: 0.95, speed: 90,  startX: -40 },
    { id: 1, y: 3,   scale: 1.2, opacity: 0.90, speed: 110, startX: 10  },
    { id: 2, y: 8,   scale: 1.5, opacity: 0.88, speed: 80,  startX: 50  },
    { id: 3, y: -4,  scale: 1.3, opacity: 0.92, speed: 100, startX: 80  },
    { id: 4, y: 6,   scale: 1.1, opacity: 0.85, speed: 120, startX: 30  },
    { id: 5, y: 14,  scale: 1.0, opacity: 0.80, speed: 95,  startX: 70  },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dark coverage blanket */}
      <div className="absolute inset-x-0 top-0 h-56"
        style={{ background: 'linear-gradient(180deg, rgba(10,14,28,0.9) 0%, rgba(20,25,45,0.7) 60%, transparent 100%)' }}
      />
      {clouds.map(c => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{ top: `${c.y}%` }}
          initial={{ x: `${c.startX}vw` }}
          animate={{ x: '130vw' }}
          transition={{ duration: c.speed, repeat: Infinity, repeatType: 'loop', ease: 'linear', delay: -(c.startX / 130) * c.speed }}
        >
          <CloudShape dark opacity={c.opacity} scale={c.scale} />
        </motion.div>
      ))}
    </div>
  );
}

// ── Lightning Bolt ─────────────────────────────────────────────────────────────
function LightningBolts() {
  const bolts = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
    id: i,
    x: 15 + i * 22 + Math.random() * 10,
    delay: i * 2.5 + Math.random() * 3,
    interval: 6 + Math.random() * 8,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bolts.map(b => (
        <motion.div
          key={b.id}
          className="absolute top-0"
          style={{ left: `${b.x}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 1, 0.3, 1, 0] }}
          transition={{
            duration: 0.4,
            delay: b.delay,
            repeat: Infinity,
            repeatDelay: b.interval,
            times: [0, 0.5, 0.6, 0.65, 0.7, 0.75, 1],
          }}
        >
          <svg width="60" height="260" viewBox="0 0 60 260" style={{ overflow: 'visible' }}>
            <defs>
              <filter id={`bolt-glow-${b.id}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Outer glow */}
            <polyline
              points="34,0 22,95 42,95 18,260"
              stroke="rgba(180,200,255,0.4)" strokeWidth="12"
              fill="none" strokeLinecap="round" strokeLinejoin="round"
              filter={`url(#bolt-glow-${b.id})`}
            />
            {/* Main bolt */}
            <polyline
              points="34,0 22,95 42,95 18,260"
              stroke="rgba(220,240,255,0.95)" strokeWidth="3"
              fill="none" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Core */}
            <polyline
              points="34,0 22,95 42,95 18,260"
              stroke="white" strokeWidth="1.5"
              fill="none" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      ))}

      {/* Screen flash on lightning */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(200,220,255,0.06)' }}
        animate={{ opacity: [0, 0, 0, 0.8, 0, 0.4, 0] }}
        transition={{ duration: 0.4, delay: bolts[0].delay, repeat: Infinity, repeatDelay: 7, times: [0, 0.5, 0.6, 0.65, 0.7, 0.75, 1] }}
      />
    </div>
  );
}

// ── Fog Wisps ──────────────────────────────────────────────────────────────────
function FogWisps() {
  const wisps = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    y: 20 + i * 12,
    opacity: 0.18 + (i % 3) * 0.06,
    width: 400 + i * 120,
    speed: 35 + i * 12,
    startX: -50 + i * 20,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {wisps.map(w => (
        <motion.div
          key={w.id}
          className="absolute"
          style={{
            top: `${w.y}%`,
            width: w.width,
            height: 60,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse 100% 50% at 50% 50%, rgba(200,215,235,0.9) 0%, rgba(180,200,225,0.4) 50%, transparent 100%)',
            opacity: w.opacity,
            filter: 'blur(12px)',
          }}
          initial={{ x: `${w.startX}vw` }}
          animate={{ x: '120vw' }}
          transition={{ duration: w.speed, repeat: Infinity, repeatType: 'loop', ease: 'linear', delay: -(w.startX / 120) * w.speed }}
        />
      ))}
    </div>
  );
}

// ── Atmospheric Night Clouds ───────────────────────────────────────────────────
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

// ── Moon ──────────────────────────────────────────────────────────────────────
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
          <mask id="moon-crescent-mask">
            <circle cx="50" cy="50" r="29" fill="white" />
            <circle cx="62" cy="45" r="23" fill="black" />
          </mask>
          <filter id="moon-f">
            <feGaussianBlur stdDeviation="1" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <motion.circle cx="50" cy="50" r="72" fill="url(#moon-outer-r)"
          animate={{ r: [72, 78, 72] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.circle cx="50" cy="50" r="46" fill="url(#moon-halo-r)"
          animate={{ r: [46, 51, 46] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        <circle cx="50" cy="50" r="29" fill="url(#moon-surf)" mask="url(#moon-crescent-mask)" filter="url(#moon-f)" />
        <ellipse cx="36" cy="38" rx="7" ry="4.5" fill="rgba(255,255,255,0.22)" mask="url(#moon-crescent-mask)" />
      </svg>
    </motion.div>
  );
}

// ── Sun ───────────────────────────────────────────────────────────────────────
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
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="sun-corona" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,210,60,0.30)" />
            <stop offset="40%"  stopColor="rgba(255,180,30,0.12)" />
            <stop offset="70%"  stopColor="rgba(255,160,0,0.05)" />
            <stop offset="100%" stopColor="rgba(255,140,0,0)" />
          </radialGradient>
          <radialGradient id="sun-core-r" cx="38%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#fffde7" />
            <stop offset="35%"  stopColor="#fde68a" />
            <stop offset="70%"  stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <radialGradient id="sun-amb-r" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(251,191,36,0.45)" />
            <stop offset="55%"  stopColor="rgba(251,191,36,0.12)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </radialGradient>
          <filter id="sun-f">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="sun-glow">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer corona */}
        <motion.circle cx="55" cy="55" r="52" fill="url(#sun-corona)"
          animate={{ r: [52, 58, 52] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />

        {/* Ambient glow */}
        <motion.circle cx="55" cy="55" r="38" fill="url(#sun-amb-r)"
          animate={{ r: [38, 42, 38] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />

        {/* Rotating rays */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '55px 55px' }}
        >
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i * 22.5 * Math.PI) / 180;
            const inner = 29;
            const outer = i % 2 === 0 ? 46 : 40;
            return (
              <line key={i}
                x1={55 + inner * Math.cos(a)} y1={55 + inner * Math.sin(a)}
                x2={55 + outer * Math.cos(a)} y2={55 + outer * Math.sin(a)}
                stroke={i % 2 === 0 ? '#fde68a' : '#fbbf24'}
                strokeWidth={i % 2 === 0 ? 2.5 : 1.5}
                strokeLinecap="round"
                opacity={i % 2 === 0 ? 0.85 : 0.5}
              />
            );
          })}
        </motion.g>

        {/* Sun disc */}
        <motion.circle cx="55" cy="55" r="23" fill="url(#sun-core-r)" filter="url(#sun-f)"
          animate={{ r: [23, 24.5, 23] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />

        {/* Highlight */}
        <ellipse cx="46" cy="45" rx="9" ry="6" fill="rgba(255,255,255,0.35)" />
        <ellipse cx="52" cy="42" rx="5" ry="3" fill="rgba(255,255,255,0.2)" />
      </svg>
    </motion.div>
  );
}

// ── Snow flurries in background ────────────────────────────────────────────────
function SnowDrift() {
  const flakes = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: i * 0.8,
    size: 6 + Math.random() * 8, dur: 12 + Math.random() * 8,
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {flakes.map(f => (
        <motion.div key={f.id} className="absolute rounded-full"
          style={{ left: `${f.x}%`, top: -20, width: f.size, height: f.size, background: 'rgba(220,235,255,0.8)', filter: 'blur(1px)' }}
          animate={{ y: ['0vh', '110vh'], x: [0, Math.sin(f.id) * 40] }}
          transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function WeatherBackground({ particleType, isDay, timezone, sunrise, sunset }: Props) {
  const [hour, setHour] = useState(() => getLocalHour(timezone));

  useEffect(() => {
    const update = () => setHour(getLocalHour(timezone));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [timezone]);

  const riseH  = parseHour(sunrise, 6.0);
  const setH   = parseHour(sunset, 20.0);
  const period = getTimePeriod(hour, riseH, setH);
  const gradient = TIME_GRADIENTS[period];
  const overlay  = WEATHER_OVERLAYS[particleType] ?? 'rgba(0,0,0,0)';
  const sunPos   = getSunPosition(hour, riseH, setH);
  const moonPos  = getMoonPosition(hour, riseH, setH);
  const isNight  = period === 'night' || period === 'predawn';
  const showSun  = sunPos !== null && particleType !== 'storm';
  const showMoon = moonPos !== null;

  const isCloudy  = particleType === 'cloudy';
  const isRain    = particleType === 'rain' || particleType === 'drizzle';
  const isStorm   = particleType === 'storm';
  const isFog     = particleType === 'fog';
  const isSnow    = particleType === 'snow';

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">

      {/* Sky gradient */}
      <div className="absolute inset-0" style={{ background: gradient, transition: 'background 4s ease' }} />

      {/* Weather overlay */}
      <div className="absolute inset-0" style={{ background: overlay, transition: 'background 2s ease' }} />

      {/* Stars at night */}
      <AnimatePresence>
        {isNight && (
          <StarField opacity={particleType === 'storm' ? 0 : particleType === 'clear' ? 0.95 : 0.5} />
        )}
      </AnimatePresence>

      {/* Shooting / falling stars — clear night sky only */}
      <AnimatePresence>
        {isNight && particleType === 'clear' && (
          <motion.div className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <ShootingStars />
          </motion.div>
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

      {/* Moon */}
      <AnimatePresence>
        {showMoon && <MoonElement key="moon" x={moonPos!.x} y={moonPos!.y} />}
      </AnimatePresence>

      {/* Sun */}
      <AnimatePresence>
        {showSun && sunPos && <SunElement key="sun" x={sunPos.x} y={sunPos.y} />}
      </AnimatePresence>

      {/* Storm clouds + lightning */}
      <AnimatePresence>
        {isStorm && (
          <motion.div className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <StormClouds />
            <LightningBolts />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Realistic clouds for cloudy / rain / drizzle */}
      <AnimatePresence>
        {(isCloudy || isRain) && (
          <motion.div className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <DriftingClouds
              count={isRain ? 7 : 5}
              dark={isRain || (!isDay)}
              dense={isRain}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fog wisps */}
      <AnimatePresence>
        {isFog && (
          <motion.div className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
          >
            <FogWisps />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snow large flakes in background */}
      <AnimatePresence>
        {isSnow && (
          <motion.div className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <SnowDrift />
          </motion.div>
        )}
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

      {/* Rain sky cap */}
      {isRain && (
        <div className="absolute top-0 left-0 right-0 h-48"
          style={{ background: 'linear-gradient(180deg, rgba(20,50,160,0.32) 0%, transparent 100%)' }}
        />
      )}

      {/* Storm screen flash */}
      {isStorm && (
        <motion.div className="absolute inset-0"
          animate={{ opacity: [0, 0, 0, 0.06, 0, 0.03, 0] }}
          transition={{ duration: 6, repeat: Infinity, times: [0, 0.6, 0.65, 0.67, 0.69, 0.72, 1] }}
          style={{ background: 'rgba(255,255,255,1)' }}
        />
      )}

      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)' }}
      />

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px',
        }}
      />
    </div>
  );
}
