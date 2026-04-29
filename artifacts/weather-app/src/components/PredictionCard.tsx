import { motion } from "framer-motion";
import { BrainCircuit, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";
import type { PredictionData } from "@/lib/weatherApi";

interface Props {
  prediction: PredictionData;
}

export default function PredictionCard({ prediction }: Props) {
  const trendIcon =
    prediction.trend === 'rising' ? TrendingUp :
    prediction.trend === 'falling' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  const trendColor =
    prediction.trend === 'rising' ? '#f97316' :
    prediction.trend === 'falling' ? '#60a5fa' : '#a78bfa';

  const r2Pct = Math.round(prediction.r2_score * 100);

  // Mini sparkline for hourly predictions
  const preds = prediction.hourly_predictions.slice(0, 24);
  const pTemps = preds.map(p => p.predicted_temp);
  const minT = Math.min(...pTemps);
  const maxT = Math.max(...pTemps);
  const tRange = maxT - minT || 1;

  const sparkW = 280, sparkH = 60;
  const points = preds.map((p, i) => {
    const x = (i / (preds.length - 1)) * sparkW;
    const y = sparkH - ((p.predicted_temp - minT) / tRange) * (sparkH - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'rgba(99,102,241,0.08)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 0 40px rgba(99,102,241,0.08)',
      }}
      data-testid="card-ml-prediction"
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.2)' }}
          >
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">ML Temperature Prediction</h3>
            <p className="text-white/40 text-xs">Python · scikit-learn · Polynomial Regression</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-indigo-400 font-bold text-sm">R² {prediction.r2_score.toFixed(2)}</div>
          <div className="text-white/40 text-xs">{r2Pct}% fit</div>
        </div>
      </div>

      {/* Trend + High/Low */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <TrendIcon className="w-5 h-5 mx-auto mb-1" style={{ color: trendColor }} />
          <div className="font-bold text-sm capitalize" style={{ color: trendColor }}>{prediction.trend}</div>
          <div className="text-white/40 text-xs">
            {prediction.trend_delta > 0 ? '+' : ''}{prediction.trend_delta.toFixed(1)}°C
          </div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <ArrowUp className="w-4 h-4 mx-auto mb-1 text-orange-400" />
          <div className="text-orange-400 font-bold text-base">{prediction.predicted_high}°</div>
          <div className="text-white/40 text-xs">High in ~{prediction.predicted_high_at_hour}h</div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
          <ArrowDown className="w-4 h-4 mx-auto mb-1 text-blue-400" />
          <div className="text-blue-400 font-bold text-base">{prediction.predicted_low}°</div>
          <div className="text-white/40 text-xs">Low in ~{prediction.predicted_low_at_hour}h</div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-4 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="px-3 pt-3 pb-1">
          <span className="text-white/40 text-xs uppercase tracking-wider">24h Prediction Curve</span>
        </div>
        <svg
          viewBox={`0 0 ${sparkW} ${sparkH}`}
          className="w-full"
          style={{ height: '70px' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
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
          {/* Confidence dots */}
          {preds.filter((_, i) => i % 4 === 0).map((p, idx) => {
            const i = idx * 4;
            const x = (i / (preds.length - 1)) * sparkW;
            const y = sparkH - ((p.predicted_temp - minT) / tRange) * (sparkH - 10) - 5;
            return (
              <circle key={i} cx={x} cy={y} r={2.5}
                fill="#818cf8" opacity={p.confidence}
              />
            );
          })}
        </svg>
        <div className="flex justify-between px-3 pb-2 text-white/30 text-xs">
          <span>Now</span>
          <span>+12h</span>
          <span>+24h</span>
        </div>
      </div>

      {/* R² bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>Model Accuracy (R² Score)</span>
          <span>{r2Pct}%</span>
        </div>
        <div className="h-1.5 bg-white/08 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${r2Pct}%` }}
            transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc)' }}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl px-4 py-3 text-white/60 text-xs leading-relaxed"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <span className="text-indigo-400 font-semibold">AI Summary: </span>
        {prediction.summary}
      </div>

      {/* Footer badge */}
      <div className="mt-3 flex items-center gap-1.5 text-white/25 text-xs">
        <BrainCircuit className="w-3 h-3" />
        <span>{prediction.model}</span>
      </div>
    </motion.div>
  );
}
