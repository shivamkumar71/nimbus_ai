import { motion } from "framer-motion";
import { Wind } from "lucide-react";
import { getWindDirection } from "@/lib/weatherApi";

interface Props {
  speed: number;
  direction: number;
  gusts: number;
}

export default function WindCard({ speed, direction, gusts }: Props) {
  const dir = getWindDirection(direction);

  function getBeaufortScale(kph: number): { level: number; label: string } {
    if (kph < 1) return { level: 0, label: 'Calm' };
    if (kph < 6) return { level: 1, label: 'Light air' };
    if (kph < 12) return { level: 2, label: 'Light breeze' };
    if (kph < 20) return { level: 3, label: 'Gentle breeze' };
    if (kph < 29) return { level: 4, label: 'Moderate breeze' };
    if (kph < 39) return { level: 5, label: 'Fresh breeze' };
    if (kph < 50) return { level: 6, label: 'Strong breeze' };
    if (kph < 62) return { level: 7, label: 'Near gale' };
    if (kph < 75) return { level: 8, label: 'Gale' };
    if (kph < 89) return { level: 9, label: 'Strong gale' };
    if (kph < 103) return { level: 10, label: 'Storm' };
    if (kph < 118) return { level: 11, label: 'Violent storm' };
    return { level: 12, label: 'Hurricane' };
  }

  const beaufort = getBeaufortScale(speed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-wind"
    >
      <div className="flex items-center gap-2 mb-4">
        <Wind className="w-4 h-4 text-emerald-400" />
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">Wind</h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Compass */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {/* Cardinal labels */}
            {['N', 'E', 'S', 'W'].map((c, i) => (
              <span key={c} className="absolute text-white/30 text-xs font-bold"
                style={{
                  top: i === 0 ? '4px' : i === 2 ? 'auto' : '50%',
                  bottom: i === 2 ? '4px' : 'auto',
                  left: i === 3 ? '5px' : i === 0 || i === 2 ? '50%' : 'auto',
                  right: i === 1 ? '5px' : 'auto',
                  transform: (i === 0 || i === 2) ? 'translateX(-50%)' : (i === 1 || i === 3) ? 'translateY(-50%)' : 'none',
                }}
              >{c}</span>
            ))}

            {/* Arrow */}
            <motion.div
              animate={{ rotate: direction }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="relative h-full w-full flex items-center justify-center">
                <div className="absolute top-3 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[24px] border-l-transparent border-r-transparent border-b-emerald-400"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.7))' }}
                />
                <div className="w-2 h-2 rounded-full bg-white/80 z-10" />
                <div className="absolute bottom-3 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[16px] border-l-transparent border-r-transparent border-t-white/20" />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-3xl font-black text-white mb-0.5">
            {Math.round(speed)} <span className="text-sm font-normal text-white/50">km/h</span>
          </div>
          <div className="text-emerald-400 font-medium text-sm">{dir} direction</div>
          <div className="text-white/40 text-xs mt-1">Beaufort {beaufort.level} · {beaufort.label}</div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-white/50 text-xs">Gusts:</span>
            <span className="text-orange-400 font-semibold text-sm">{Math.round(gusts)} km/h</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
