import { motion } from "framer-motion";
import { BrainCircuit, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";
import type { PredictionData } from "@/lib/weatherApi";

interface Props {
  prediction: PredictionData;
}

export default function PredictionCard({ prediction }: Props) {
  const TrendIcon =
    prediction.trend === 'rising' ? TrendingUp :
    prediction.trend === 'falling' ? TrendingDown : Minus;

  const trendColor =
    prediction.trend === 'rising' ? '#f97316' :
    prediction.trend === 'falling' ? '#60a5fa' : '#a78bfa';

  const r2Pct = Math.round(prediction.r2_score * 100);
  const r2Color = r2Pct >= 85 ? '#22c55e' : r2Pct >= 65 ? '#eab308' : '#f97316';

  const preds = prediction.hourly_predictions.slice(0, 24);
  const pTemps = preds.map(p => p.predicted_temp);
  const minT = Math.min(...pTemps);
  const maxT = Math.max(...pTemps);
  const tRange = maxT - minT || 1;

  const sparkW = 300;
  const sparkH = 64;
  const points = preds.map((p, i) => {
    const x = (i / (preds.length - 1)) * sparkW;
    const y = sparkH - ((p.predicted_temp - minT) / tRange) * (sparkH - 12) - 6;
    return `${x},${y}`;
  }).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-3xl p-4 sm:p-6 relative overflow-hidden"
      style={{
        background: 'rgba(99,102,241,0.08)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 0 40px rgba(99,102,241,0.08)',
      }}
      data-testid="card-ml-prediction"
    >
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.2)' }}
          >
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-sm">AI Temperature Forecast</h3>
            <p className="text-white/40 text-xs truncate">Ensemble ML · Python · scikit-learn</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-sm" style={{ color: r2Color }}>R² {prediction.r2_score.toFixed(2)}</div>
          <div className="text-white/40 text-xs">{r2Pct}% accuracy</div>
        </div>
      </div>

      {/* Trend + High/Low — 3-col on all sizes */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <div className="rounded-2xl p-2.5 sm:p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <TrendIcon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" style={{ color: trendColor }} />
          <div className="font-bold text-xs sm:text-sm capitalize" style={{ color: trendColor }}>{prediction.trend}</div>
          <div className="text-white/40 text-xs">
            {prediction.trend_delta > 0 ? '+' : ''}{prediction.trend_delta.toFixed(1)}°
          </div>
        </div>
        <div className="rounded-2xl p-2.5 sm:p-3 text-center" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-1 text-orange-400" />
          <div className="text-orange-400 font-bold text-sm sm:text-base">{prediction.predicted_high}°</div>
          <div className="text-white/40 text-xs">High ~{prediction.predicted_high_at_hour}h</div>
        </div>
        <div className="rounded-2xl p-2.5 sm:p-3 text-center" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
          <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-1 text-blue-400" />
          <div className="text-blue-400 font-bold text-sm sm:text-base">{prediction.predicted_low}°</div>
          <div className="text-white/40 text-xs">Low ~{prediction.predicted_low_at_hour}h</div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-4 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="px-3 pt-3 pb-1 flex items-center justify-between">
          <span className="text-white/40 text-xs uppercase tracking-wider">24h Prediction Curve</span>
          <span className="text-indigo-400/60 text-xs">Ensemble model</span>
        </div>
        <svg
          viewBox={`0 0 ${sparkW} ${sparkH}`}
          className="w-full"
          style={{ height: '70px' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${sparkH} ${points} ${sparkW},${sparkH}`}
            fill="url(#predGrad)"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {preds.filter((_, i) => i % 4 === 0).map((p, idx) => {
            const i = idx * 4;
            const x = (i / (preds.length - 1)) * sparkW;
            const y = sparkH - ((p.predicted_temp - minT) / tRange) * (sparkH - 12) - 6;
            return (
              <circle key={i} cx={x} cy={y} r={3}
                fill="#818cf8" opacity={p.confidence}
              />
            );
          })}
        </svg>
        <div className="flex justify-between px-3 pb-2 text-white/30 text-xs">
          <span>Now</span>
          <span>+6h</span>
          <span>+12h</span>
          <span>+18h</span>
          <span>+24h</span>
        </div>
      </div>

      {/* Accuracy bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/40 mb-1.5">
          <span>Ensemble Accuracy (R²)</span>
          <span style={{ color: r2Color }}>{r2Pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${r2Pct}%` }}
            transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc)' }}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl px-4 py-3 text-white/60 text-xs leading-relaxed"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <span className="text-indigo-400 font-semibold">Forecast Analysis: </span>
        {prediction.summary}
      </div>

      {/* Model badge */}
      <div className="mt-3 flex items-center gap-1.5 text-white/20 text-xs">
        <BrainCircuit className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{prediction.model}</span>
      </div>
    </motion.div>
  );
}
