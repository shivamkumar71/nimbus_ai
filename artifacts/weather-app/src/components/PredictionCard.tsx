import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, BarChart3 } from "lucide-react";
import type { PredictionData } from "@/lib/weatherApi";

interface Props {
  prediction: PredictionData;
}

export default function PredictionCard({ prediction }: Props) {
  const TrendIcon =
    prediction.trend === 'rising' ? TrendingUp :
    prediction.trend === 'falling' ? TrendingDown : Minus;

  const trendColor =
    prediction.trend === 'rising' ? '#fb923c' :
    prediction.trend === 'falling' ? '#60a5fa' : '#a78bfa';

  const trendBg =
    prediction.trend === 'rising' ? 'rgba(251,146,60,0.1)' :
    prediction.trend === 'falling' ? 'rgba(96,165,250,0.1)' : 'rgba(167,139,250,0.1)';

  const trendBorder =
    prediction.trend === 'rising' ? 'rgba(251,146,60,0.25)' :
    prediction.trend === 'falling' ? 'rgba(96,165,250,0.25)' : 'rgba(167,139,250,0.25)';

  const preds = prediction.hourly_predictions.slice(0, 24);
  const pTemps = preds.map(p => p.predicted_temp);
  const minT = Math.min(...pTemps);
  const maxT = Math.max(...pTemps);
  const tRange = maxT - minT || 1;

  const sparkW = 300;
  const sparkH = 60;
  const points = preds.map((p, i) => {
    const x = (i / (preds.length - 1)) * sparkW;
    const y = sparkH - ((p.predicted_temp - minT) / tRange) * (sparkH - 14) - 7;
    return `${x},${y}`;
  }).join(' ');

  const trendLabel =
    prediction.trend === 'rising' ? 'Warming' :
    prediction.trend === 'falling' ? 'Cooling' : 'Steady';

  const outlook =
    prediction.trend === 'rising'
      ? `Temperatures will rise ~${Math.abs(prediction.trend_delta).toFixed(1)}°C through the day, peaking at ${prediction.predicted_high}°C around hour ${prediction.predicted_high_at_hour}.`
      : prediction.trend === 'falling'
      ? `Temperatures will drop ~${Math.abs(prediction.trend_delta).toFixed(1)}°C through the day, reaching a low of ${prediction.predicted_low}°C around hour ${prediction.predicted_low_at_hour}.`
      : `Temperatures will hold steady between ${prediction.predicted_low}°C and ${prediction.predicted_high}°C throughout the day.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-3xl p-4 sm:p-6 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
      data-testid="card-ml-prediction"
    >
      {/* Subtle gradient glow top-right */}
      <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${trendColor} 0%, transparent 70%)` }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <BarChart3 className="w-5 h-5 text-white/70" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">Forecast Analysis</h3>
          <p className="text-white/40 text-xs">Next 24 hours · AI-powered prediction</p>
        </div>
      </div>

      {/* Trend + High/Low */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {/* Trend */}
        <div className="rounded-2xl p-3 flex flex-col items-center justify-center gap-1"
          style={{ background: trendBg, border: `1px solid ${trendBorder}` }}
        >
          <TrendIcon className="w-5 h-5" style={{ color: trendColor }} />
          <div className="font-bold text-xs sm:text-sm" style={{ color: trendColor }}>{trendLabel}</div>
          <div className="text-white/40 text-xs">
            {prediction.trend_delta > 0 ? '+' : ''}{prediction.trend_delta.toFixed(1)}°
          </div>
        </div>

        {/* High */}
        <div className="rounded-2xl p-3 flex flex-col items-center justify-center gap-1"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)' }}
        >
          <ArrowUp className="w-4 h-4 text-orange-400" />
          <div className="text-orange-300 font-black text-lg leading-none">{prediction.predicted_high}°</div>
          <div className="text-white/40 text-xs">Peak</div>
        </div>

        {/* Low */}
        <div className="rounded-2xl p-3 flex flex-col items-center justify-center gap-1"
          style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.18)' }}
        >
          <ArrowDown className="w-4 h-4 text-blue-400" />
          <div className="text-blue-300 font-black text-lg leading-none">{prediction.predicted_low}°</div>
          <div className="text-white/40 text-xs">Low</div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-4 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <span className="text-white/50 text-xs font-medium">Temperature Outlook</span>
          <span className="text-white/30 text-xs">{prediction.predicted_low}° – {prediction.predicted_high}°</span>
        </div>
        <svg
          viewBox={`0 0 ${sparkW} ${sparkH}`}
          className="w-full"
          style={{ height: '68px' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="fcGradFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fcGradLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor={trendColor} />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${sparkH} ${points} ${sparkW},${sparkH}`}
            fill="url(#fcGradFill)"
          />
          <polyline
            points={points}
            fill="none"
            stroke="url(#fcGradLine)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Hourly dots every 6h */}
          {preds.filter((_, i) => i % 6 === 0).map((p, idx) => {
            const i = idx * 6;
            const x = (i / (preds.length - 1)) * sparkW;
            const y = sparkH - ((p.predicted_temp - minT) / tRange) * (sparkH - 14) - 7;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={3.5} fill="rgba(0,0,0,0.5)" />
                <circle cx={x} cy={y} r={2.5} fill={trendColor} opacity={0.9} />
              </g>
            );
          })}
        </svg>
        <div className="flex justify-between px-4 pb-2.5 text-white/25 text-xs">
          <span>Now</span>
          <span>+6h</span>
          <span>+12h</span>
          <span>+18h</span>
          <span>+24h</span>
        </div>
      </div>

      {/* Outlook summary */}
      <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
          style={{ background: trendColor }}
        />
        <p className="text-white/55 text-xs leading-relaxed">{outlook}</p>
      </div>
    </motion.div>
  );
}
