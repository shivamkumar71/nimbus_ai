import { motion } from "framer-motion";
import { useId } from "react";

interface Props {
  code: number;
  isDay?: number;
  size?: number;
  className?: string;
}

type IconType = 'sunny' | 'night' | 'partly-day' | 'partly-night' |
  'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

function getIconType(code: number, isDay: number): IconType {
  const night = isDay === 0;
  if (code === 0) return night ? 'night' : 'sunny';
  if (code <= 2) return night ? 'partly-night' : 'partly-day';
  if (code === 3) return 'cloudy';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 84) return 'rain';
  if (code <= 94) return 'snow';
  return 'storm';
}

// ── Cloud shape (reusable) ────────────────────────────────────────────────────
function CloudGroup({ cx = 32, cy = 34, w = 44, variant = 'light' }: {
  cx?: number; cy?: number; w?: number;
  variant?: 'light' | 'dark' | 'blue' | 'storm';
}) {
  const colors = {
    light: { body: '#cbd5e1', top: '#f1f5f9' },
    dark:  { body: '#64748b', top: '#94a3b8' },
    blue:  { body: '#93c5fd', top: '#dbeafe' },
    storm: { body: '#334155', top: '#475569' },
  }[variant];
  const h = w * 0.45;
  return (
    <g>
      <circle cx={cx - w * 0.17} cy={cy - h * 0.55} r={w * 0.19} fill={colors.top} />
      <circle cx={cx + w * 0.04} cy={cy - h * 0.85} r={w * 0.25} fill={colors.top} />
      <circle cx={cx + w * 0.24} cy={cy - h * 0.60} r={w * 0.20} fill={colors.top} />
      <rect
        x={cx - w / 2} y={cy - h * 0.25}
        width={w} height={h * 0.65}
        rx={w * 0.18} fill={colors.body}
      />
    </g>
  );
}

// ── Rain drops (reusable) ─────────────────────────────────────────────────────
function RainDrops({ cx = 32, startY = 38, count = 4, color = '#93c5fd', length = 6 }: {
  cx?: number; startY?: number; count?: number; color?: string; length?: number;
}) {
  const offsets = [-12, -4, 4, 12, 20].slice(0, count);
  return (
    <>
      {offsets.map((dx, i) => (
        <motion.line
          key={i}
          x1={cx + dx} y1={startY}
          x2={cx + dx - 2} y2={startY + length}
          stroke={color} strokeWidth="2" strokeLinecap="round"
          initial={{ y: 0, opacity: 0.8 }}
          animate={{ y: [0, 8, 0], opacity: [0.9, 0.3, 0.9] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeIn' }}
        />
      ))}
    </>
  );
}

// ── Snow flakes (reusable) ────────────────────────────────────────────────────
function SnowFlakes({ cx = 32, startY = 40, count = 4 }: {
  cx?: number; startY?: number; count?: number;
}) {
  const offsets = [-10, -2, 6, 14].slice(0, count);
  return (
    <>
      {offsets.map((dx, i) => (
        <motion.g key={i}
          initial={{ y: 0, opacity: 0.9 }}
          animate={{ y: [0, 7, 0], opacity: [0.9, 0.4, 0.9], rotate: [0, 30, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
          style={{ transformOrigin: `${cx + dx}px ${startY + 3}px` }}
        >
          {/* 6-point snowflake using 3 crossed lines */}
          {[0, 60, 120].map(angle => {
            const rad = (angle * Math.PI) / 180;
            const len = 4;
            return (
              <line key={angle}
                x1={cx + dx + Math.cos(rad) * len} y1={startY + i * 2 + Math.sin(rad) * len}
                x2={cx + dx - Math.cos(rad) * len} y2={startY + i * 2 - Math.sin(rad) * len}
                stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round"
              />
            );
          })}
        </motion.g>
      ))}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnimatedWeatherIcon({ code, isDay = 1, size = 48, className = '' }: Props) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const type = getIconType(code, isDay);

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ overflow: 'visible', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`sg-${uid}`} cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="45%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id={`mg-${uid}`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`sun-glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── SUNNY ──────────────────────────────────────────────────────────── */}
      {type === 'sunny' && (
        <>
          {/* Outer ambient glow */}
          <circle cx="32" cy="30" r="26" fill="rgba(251,191,36,0.12)" />
          <circle cx="32" cy="30" r="20" fill="rgba(251,191,36,0.1)" />
          {/* Rotating rays */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '32px 30px' }}
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const r1 = 17, r2 = 25;
              return (
                <line key={i}
                  x1={32 + r1 * Math.cos(angle)} y1={30 + r1 * Math.sin(angle)}
                  x2={32 + r2 * Math.cos(angle)} y2={30 + r2 * Math.sin(angle)}
                  stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round"
                />
              );
            })}
          </motion.g>
          {/* Sun disc */}
          <motion.circle
            cx="32" cy="30" r="13"
            fill={`url(#sg-${uid})`}
            filter={`url(#sun-glow-${uid})`}
            animate={{ r: [13, 13.8, 13] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Highlight */}
          <ellipse cx="27" cy="25" rx="5" ry="3.5" fill="rgba(255,255,255,0.35)" />
        </>
      )}

      {/* ── NIGHT / CLEAR ──────────────────────────────────────────────────── */}
      {type === 'night' && (
        <>
          {/* Moon glow */}
          <circle cx="34" cy="24" r="18" fill="rgba(226,232,240,0.08)" />
          {/* Moon body */}
          <motion.circle
            cx="34" cy="24" r="14"
            fill={`url(#mg-${uid})`}
            filter={`url(#glow-${uid})`}
            animate={{ opacity: [1, 0.85, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Crescent mask */}
          <circle cx="40" cy="20" r="11" fill="#0a1525" />
          {/* Stars */}
          {[{ x: 12, y: 12 }, { x: 55, y: 18 }, { x: 8, y: 36 }, { x: 52, y: 40 }].map((s, i) => (
            <motion.circle key={i} cx={s.x} cy={s.y} r="1.5" fill="white"
              animate={{ opacity: [0.9, 0.2, 0.9], r: [1.5, 1, 1.5] }}
              transition={{ duration: 1.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </>
      )}

      {/* ── PARTLY CLOUDY DAY ──────────────────────────────────────────────── */}
      {type === 'partly-day' && (
        <>
          {/* Small sun behind */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '20px 22px' }}
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60 * Math.PI) / 180;
              const r1 = 10, r2 = 15;
              return (
                <line key={i}
                  x1={20 + r1 * Math.cos(angle)} y1={22 + r1 * Math.sin(angle)}
                  x2={20 + r2 * Math.cos(angle)} y2={22 + r2 * Math.sin(angle)}
                  stroke="#fde68a" strokeWidth="2" strokeLinecap="round" opacity="0.9"
                />
              );
            })}
          </motion.g>
          <circle cx="20" cy="22" r="9" fill={`url(#sg-${uid})`} />
          {/* Cloud overlay */}
          <motion.g
            animate={{ x: [0, 1.5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CloudGroup cx={38} cy={38} w={40} variant="light" />
          </motion.g>
        </>
      )}

      {/* ── PARTLY CLOUDY NIGHT ────────────────────────────────────────────── */}
      {type === 'partly-night' && (
        <>
          {/* Small moon */}
          <circle cx="18" cy="22" r="10" fill={`url(#mg-${uid})`} />
          <circle cx="23" cy="18" r="7.5" fill="#0d1b2e" />
          {/* Cloud */}
          <motion.g
            animate={{ x: [0, 1.5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CloudGroup cx={38} cy={40} w={40} variant="light" />
          </motion.g>
        </>
      )}

      {/* ── CLOUDY ─────────────────────────────────────────────────────────── */}
      {type === 'cloudy' && (
        <motion.g
          animate={{ x: [0, 2, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Back cloud (darker) */}
          <CloudGroup cx={36} cy={30} w={36} variant="dark" />
          {/* Front cloud (lighter) */}
          <CloudGroup cx={28} cy={40} w={44} variant="light" />
        </motion.g>
      )}

      {/* ── FOG ────────────────────────────────────────────────────────────── */}
      {type === 'fog' && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <motion.rect key={i}
              x="6" y={16 + i * 12}
              width={52 - i * 4} height="6"
              rx="3" fill="#94a3b8"
              animate={{ opacity: [0.6, 0.3, 0.6], x: [0, i % 2 === 0 ? 3 : -3, 0] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </>
      )}

      {/* ── DRIZZLE ────────────────────────────────────────────────────────── */}
      {type === 'drizzle' && (
        <>
          <CloudGroup cx={32} cy={28} w={42} variant="dark" />
          <RainDrops cx={26} startY={40} count={3} color="#93c5fd" length={5} />
        </>
      )}

      {/* ── RAIN ───────────────────────────────────────────────────────────── */}
      {type === 'rain' && (
        <>
          <CloudGroup cx={32} cy={26} w={44} variant="dark" />
          <RainDrops cx={24} startY={38} count={4} color="#60a5fa" length={7} />
        </>
      )}

      {/* ── SNOW ───────────────────────────────────────────────────────────── */}
      {type === 'snow' && (
        <>
          <CloudGroup cx={32} cy={26} w={44} variant="blue" />
          <SnowFlakes cx={24} startY={40} count={4} />
        </>
      )}

      {/* ── STORM ──────────────────────────────────────────────────────────── */}
      {type === 'storm' && (
        <>
          <CloudGroup cx={32} cy={24} w={48} variant="storm" />
          {/* Lightning bolt */}
          <motion.path
            d="M 35 34 L 28 44 L 33 44 L 29 54 L 38 41 L 33 41 Z"
            fill="#fde68a"
            filter={`url(#glow-${uid})`}
            animate={{ opacity: [1, 0.2, 1, 0.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, times: [0, 0.3, 0.5, 0.7, 1] }}
          />
          {/* Rain on sides */}
          <RainDrops cx={20} startY={36} count={2} color="#7dd3fc" length={5} />
          <RainDrops cx={44} startY={36} count={2} color="#7dd3fc" length={5} />
        </>
      )}
    </svg>
  );
}
