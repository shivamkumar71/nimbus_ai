import { motion } from "framer-motion";
import { Gauge } from "lucide-react";

interface Props {
  pressure: number;
}

export default function PressureCard({ pressure }: Props) {
  function getPressureLabel(p: number): { label: string; color: string } {
    if (p < 1000) return { label: 'Low Pressure', color: '#f97316' };
    if (p < 1013) return { label: 'Below Normal', color: '#fbbf24' };
    if (p < 1020) return { label: 'Normal', color: '#34d399' };
    if (p < 1030) return { label: 'Above Normal', color: '#60a5fa' };
    return { label: 'High Pressure', color: '#a78bfa' };
  }

  const info = getPressureLabel(pressure);
  // Gauge: 950–1050 hPa range
  const min = 950, max = 1050;
  const pct = Math.min(Math.max((pressure - min) / (max - min), 0), 1);
  const angle = -135 + pct * 270; // -135° to +135°

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-pressure"
    >
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-4 h-4 text-purple-400" />
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">Pressure</h3>
      </div>

      <div className="flex items-center gap-5">
        {/* Gauge SVG */}
        <div className="flex-shrink-0">
          <svg width="90" height="70" viewBox="0 0 90 70">
            <path d="M 10 60 A 35 35 0 0 1 80 60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
            <motion.path
              d="M 10 60 A 35 35 0 0 1 80 60"
              fill="none"
              stroke={info.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${Math.PI * 35}`}
              initial={{ strokeDashoffset: Math.PI * 35 }}
              animate={{ strokeDashoffset: Math.PI * 35 * (1 - pct) }}
              transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 4px ${info.color})` }}
            />
            {/* Needle */}
            <motion.line
              x1="45" y1="60"
              x2="45" y2="30"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ rotate: -135 }}
              animate={{ rotate: angle }}
              transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
              style={{ transformOrigin: '45px 60px' }}
            />
            <circle cx="45" cy="60" r="4" fill="white" />

            <text x="10" y="75" style={{ fontSize: '8px', fill: 'rgba(255,255,255,0.3)', fontFamily: 'sans-serif' }}>950</text>
            <text x="68" y="75" style={{ fontSize: '8px', fill: 'rgba(255,255,255,0.3)', fontFamily: 'sans-serif' }}>1050</text>
          </svg>
        </div>

        <div className="flex-1">
          <div className="text-2xl font-black text-white">
            {Math.round(pressure)} <span className="text-xs font-normal text-white/50">hPa</span>
          </div>
          <div className="font-medium text-sm mt-1" style={{ color: info.color }}>{info.label}</div>
          <div className="text-white/40 text-xs mt-1">
            {pressure < 1013 ? 'Expect clouds/rain' : pressure < 1020 ? 'Fair weather likely' : 'Clear skies expected'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
