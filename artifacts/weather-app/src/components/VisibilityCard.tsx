import { motion } from "framer-motion";
import { Eye } from "lucide-react";

interface Props {
  visibility: number; // in meters
}

export default function VisibilityCard({ visibility }: Props) {
  const km = visibility / 1000;

  function getLabel(v: number): { label: string; color: string; desc: string } {
    if (v < 0.05) return { label: 'Dense Fog', color: '#94a3b8', desc: 'Extremely low visibility' };
    if (v < 0.2) return { label: 'Fog', color: '#94a3b8', desc: 'Very difficult to see' };
    if (v < 1) return { label: 'Mist', color: '#7dd3fc', desc: 'Reduced visibility' };
    if (v < 4) return { label: 'Poor', color: '#fbbf24', desc: 'Hazy conditions' };
    if (v < 10) return { label: 'Moderate', color: '#34d399', desc: 'Fair visibility' };
    return { label: 'Excellent', color: '#60a5fa', desc: 'Crystal clear' };
  }

  const info = getLabel(km);
  const pct = Math.min((km / 20) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.67 }}
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-visibility"
    >
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-blue-400" />
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">Visibility</h3>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-black text-white">{km >= 10 ? `${Math.round(km)}` : km.toFixed(1)}</span>
        <span className="text-white/50 text-sm pb-1">km</span>
      </div>

      <div className="font-semibold text-sm mb-1" style={{ color: info.color }}>{info.label}</div>
      <div className="text-white/40 text-xs mb-4">{info.desc}</div>

      {/* Visual bars representing layers of visibility */}
      <div className="space-y-1.5">
        {[0.25, 0.5, 0.75, 1].map((threshold, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/08 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: pct > threshold * 100 ? '100%' : `${(pct / (threshold * 100)) * 100}%` }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
                style={{ background: info.color, opacity: 1 - i * 0.15 }}
              />
            </div>
            <span className="text-white/30 text-xs w-8 text-right">{(threshold * 20).toFixed(0)}km</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
