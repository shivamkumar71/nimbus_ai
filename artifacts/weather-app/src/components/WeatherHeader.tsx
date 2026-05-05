import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Star, StarOff, RefreshCw } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import type { GeocodingResult } from "@/lib/weatherApi";

export interface SavedLocation {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface WeatherTheme {
  gradient: string;
  showClouds: boolean;
  cloudsOpacity: number;
  rainIntensity: number;
  sunOpacity: number;
  isNight: boolean;
}

function getWeatherTheme(code: number, isDay: number): WeatherTheme {
  const night = isDay === 0;

  if (night) return {
    gradient: 'linear-gradient(180deg, #0D0D1A 0%, #1A237E 70%, #1e2a5e 100%)',
    showClouds: false, cloudsOpacity: 0, rainIntensity: 0, sunOpacity: 0, isNight: true,
  };
  if (code >= 95) return {
    gradient: 'linear-gradient(180deg, #111827 0%, #1f2937 50%, #374151 100%)',
    showClouds: true, cloudsOpacity: 0.9, rainIntensity: 2, sunOpacity: 0.1, isNight: false,
  };
  if (code >= 80) return {
    gradient: 'linear-gradient(180deg, #1e293b 0%, #263238 55%, #37474F 100%)',
    showClouds: true, cloudsOpacity: 0.85, rainIntensity: 2, sunOpacity: 0.15, isNight: false,
  };
  if (code >= 51) return {
    gradient: 'linear-gradient(180deg, #263238 0%, #37474F 55%, #455A64 100%)',
    showClouds: true, cloudsOpacity: 0.75, rainIntensity: 1, sunOpacity: 0.25, isNight: false,
  };
  if (code >= 45) return {
    gradient: 'linear-gradient(180deg, #546E7A 0%, #78909C 55%, #90A4AE 100%)',
    showClouds: true, cloudsOpacity: 0.55, rainIntensity: 0, sunOpacity: 0.35, isNight: false,
  };
  if (code === 3) return {
    gradient: 'linear-gradient(180deg, #37474F 0%, #546E7A 55%, #78909C 100%)',
    showClouds: true, cloudsOpacity: 0.85, rainIntensity: 0, sunOpacity: 0.2, isNight: false,
  };
  if (code <= 2) return {
    gradient: 'linear-gradient(180deg, #0d47a1 0%, #1976D2 40%, #42A5F5 100%)',
    showClouds: true, cloudsOpacity: 0.45, rainIntensity: 0, sunOpacity: 0.9, isNight: false,
  };
  return {
    gradient: 'linear-gradient(180deg, #0277BD 0%, #0288D1 40%, #4FC3F7 100%)',
    showClouds: false, cloudsOpacity: 0, rainIntensity: 0, sunOpacity: 1, isNight: false,
  };
}

// ── Animated Sun ───────────────────────────────────────────────────────────────
function HeaderSun({ opacity }: { opacity: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top: 14, right: 40 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 1.2 }}
    >
      <svg width="68" height="68" viewBox="0 0 68 68" style={{ overflow: 'visible' }}>
        <circle cx="34" cy="34" r="40" fill="rgba(253,216,53,0.07)" />
        <circle cx="34" cy="34" r="28" fill="rgba(253,216,53,0.06)" />
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '34px 34px' }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            return (
              <line key={i}
                x1={34 + 22 * Math.cos(a)} y1={34 + 22 * Math.sin(a)}
                x2={34 + 32 * Math.cos(a)} y2={34 + 32 * Math.sin(a)}
                stroke="#FF8F00" strokeWidth="2.5" strokeLinecap="round"
              />
            );
          })}
        </motion.g>
        <motion.circle cx="34" cy="34" r="18"
          fill="#FDD835"
          animate={{ r: [18, 19, 18] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,143,0,0.7))' }}
        />
        <ellipse cx="28" cy="28" rx="5.5" ry="3.5" fill="rgba(255,255,255,0.32)" />
      </svg>
    </motion.div>
  );
}

// ── Animated Moon ──────────────────────────────────────────────────────────────
function HeaderMoon() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top: 16, right: 44 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 1.2 }}
    >
      <svg width="60" height="60" viewBox="0 0 60 60" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="hdr-moon-g" cx="35%" cy="28%" r="65%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#8fa0b8" />
          </radialGradient>
          <mask id="hdr-moon-mask">
            <circle cx="28" cy="28" r="17" fill="white" />
            <circle cx="37" cy="23" r="13" fill="black" />
          </mask>
        </defs>
        <circle cx="28" cy="28" r="26" fill="rgba(180,210,255,0.07)" />
        <motion.circle cx="28" cy="28" r="17"
          fill="url(#hdr-moon-g)"
          mask="url(#hdr-moon-mask)"
          animate={{ opacity: [1, 0.82, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(180,210,255,0.5))' }}
        />
        <ellipse cx="21" cy="22" rx="4.5" ry="2.5"
          fill="rgba(255,255,255,0.25)"
          mask="url(#hdr-moon-mask)"
        />
        {[{ x: 8, y: 9 }, { x: 50, y: 14 }, { x: 6, y: 44 }, { x: 52, y: 46 }].map((s, i) => (
          <motion.circle key={i} cx={s.x} cy={s.y} r="1.5" fill="white"
            animate={{ opacity: [0.9, 0.15, 0.9] }}
            transition={{ duration: 1.8 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

// ── Cloud shape ────────────────────────────────────────────────────────────────
function CloudShape({ opacity, top, scale = 1, speed = 22, delay = 0 }: {
  opacity: number; top: string; scale?: number; speed?: number; delay?: number;
}) {
  const w = 200 * scale;
  const h = 70 * scale;
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top, right: 0, width: w, height: h, opacity }}
      animate={{ x: [w + 60, -(1600)] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear', delay }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{
          position: 'absolute', bottom: 0, left: '8%', width: '84%', height: '52%',
          background: 'rgba(255,255,255,0.88)', borderRadius: 60,
        }} />
        <div style={{
          position: 'absolute', bottom: '32%', left: '12%', width: '46%', height: '68%',
          background: 'rgba(255,255,255,0.88)', borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '28%', left: '38%', width: '40%', height: '62%',
          background: 'rgba(255,255,255,0.88)', borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '18%', left: '60%', width: '28%', height: '50%',
          background: 'rgba(255,255,255,0.88)', borderRadius: '50%',
        }} />
      </div>
    </motion.div>
  );
}

// ── Rain drops ─────────────────────────────────────────────────────────────────
function HeaderRain({ intensity }: { intensity: number }) {
  const count = intensity >= 2 ? 22 : 12;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const left = (i / count) * 100;
        const dur = intensity >= 2 ? 0.55 + Math.random() * 0.2 : 0.85 + Math.random() * 0.3;
        const h = intensity >= 2 ? 14 : 10;
        return (
          <motion.div key={i}
            style={{
              position: 'absolute',
              top: -h,
              left: `${left + Math.random() * (100 / count)}%`,
              width: 1,
              height: h,
              background: 'rgba(147,197,253,0.55)',
              borderRadius: 1,
            }}
            animate={{ y: [0, 120], opacity: [0.7, 0] }}
            transition={{ duration: dur, repeat: Infinity, delay: (i / count) * dur, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
}

// ── Main WeatherHeader ─────────────────────────────────────────────────────────
interface Props {
  weatherCode?: number;
  isDay?: number;
  location: SavedLocation | null;
  savedLocations: SavedLocation[];
  isFavorited: boolean;
  loading: boolean;
  isGeolocating: boolean;
  onSelect: (geo: GeocodingResult) => void;
  onGeolocate: () => void;
  onToggleFavorite: () => void;
  onRefresh: () => void;
  onSelectSaved: (loc: SavedLocation) => void;
}

export default function WeatherHeader({
  weatherCode, isDay, location, savedLocations, isFavorited,
  loading, isGeolocating, onSelect, onGeolocate, onToggleFavorite, onRefresh, onSelectSaved,
}: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hasWeather = weatherCode !== undefined && isDay !== undefined;
  const theme = hasWeather ? getWeatherTheme(weatherCode!, isDay!) : null;

  return (
    <header className="sticky top-0 z-40" style={{ transition: 'box-shadow 0.3s ease' }}>

      {/* ── Sky section (collapses on scroll) ── */}
      <AnimatePresence>
        {!scrolled && theme && (
          <motion.div
            key="sky"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 100, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              background: theme.gradient,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Cloud layers */}
            {theme.showClouds && (
              <>
                <CloudShape opacity={theme.cloudsOpacity} top="10%" scale={1.2} speed={24} delay={0} />
                <CloudShape opacity={theme.cloudsOpacity * 0.75} top="38%" scale={0.85} speed={18} delay={6} />
                <CloudShape opacity={theme.cloudsOpacity * 0.55} top="55%" scale={0.65} speed={30} delay={12} />
              </>
            )}

            {/* Rain in header */}
            {theme.rainIntensity > 0 && <HeaderRain intensity={theme.rainIntensity} />}

            {/* Sun / Moon — fixed in upper-right of sky section */}
            <AnimatePresence mode="wait">
              {theme.isNight
                ? <HeaderMoon key="moon" />
                : <HeaderSun key="sun" opacity={theme.sunOpacity} />
              }
            </AnimatePresence>

            {/* Bottom fade for smooth blend into controls */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
              background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.18))',
              pointerEvents: 'none',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls bar (always visible) ── */}
      <div style={{
        background: 'rgba(0,0,0,0.22)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
            >
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="gradient-text font-black text-xl hidden sm:block tracking-tight">Nimbus</span>
          </div>

          {/* Search */}
          <div className="flex-1">
            <SearchBar
              onSelect={onSelect}
              onGeolocate={onGeolocate}
              isGeolocating={isGeolocating}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {location && (
              <button
                onClick={onToggleFavorite}
                data-testid="button-favorite"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorited
                  ? <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  : <StarOff className="w-4 h-4 text-white/50" />
                }
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={loading}
              data-testid="button-refresh"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Saved locations strip */}
        {savedLocations.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pb-2.5 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {savedLocations.map((loc, i) => {
              const active = location?.name === loc.name && location?.country === loc.country;
              return (
                <button
                  key={i}
                  onClick={() => onSelectSaved(loc)}
                  data-testid={`saved-location-${i}`}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
                    border: active ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    color: active ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  ★ {loc.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
