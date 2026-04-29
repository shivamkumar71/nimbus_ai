import { motion } from "framer-motion";
import { Sun } from "lucide-react";
import { getUvLabel } from "@/lib/weatherApi";

interface Props {
  uvIndex: number;
  maxUv?: number;
}

export default function UVIndexCard({ uvIndex, maxUv }: Props) {
  const uvInfo = getUvLabel(uvIndex);
  const percent = Math.min((uvIndex / 12) * 100, 100);

  // Semi-circle gauge
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = Math.PI * r; // half circle
  const offset = circumference - (percent / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-uv-index"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sun className="w-4 h-4 text-yellow-400" />
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">UV Index</h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="70" viewBox="0 0 120 70">
            {/* Background arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Value arc */}
            <motion.path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke={uvInfo.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 6px ${uvInfo.color})` }}
            />
            {/* Center text */}
            <text x="60" y="52" textAnchor="middle" className="fill-white" style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>
              {uvIndex.toFixed(1)}
            </text>
          </svg>
        </div>

        <div>
          <div className="font-bold text-lg" style={{ color: uvInfo.color }}>{uvInfo.label}</div>
          {maxUv !== undefined && (
            <div className="text-white/50 text-xs mt-1">Max today: {maxUv.toFixed(1)}</div>
          )}
          <div className="text-white/40 text-xs mt-2 leading-relaxed">
            {uvIndex <= 2 ? 'No protection needed' :
              uvIndex <= 5 ? 'Wear sunscreen SPF 30+' :
              uvIndex <= 7 ? 'Sunscreen + hat required' :
              uvIndex <= 10 ? 'Avoid midday sun' :
              'Stay indoors if possible'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
