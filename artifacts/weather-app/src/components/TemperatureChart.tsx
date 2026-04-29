import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { formatHour } from "@/lib/weatherApi";

interface Props {
  hourlyData: { time: string; temp: number; precipProb: number; code: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
      style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
    >
      <div className="text-white/60 mb-1">{label}</div>
      <div className="text-blue-400 font-bold">{Math.round(payload[0]?.value)}°C</div>
      {payload[1]?.value > 0 && (
        <div className="text-sky-400">{payload[1].value}% rain</div>
      )}
    </div>
  );
}

export default function TemperatureChart({ hourlyData }: Props) {
  const chartData = hourlyData.slice(0, 12).map(d => ({
    time: formatHour(d.time),
    temp: Math.round(d.temp),
    precip: d.precipProb,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      data-testid="card-temperature-chart"
    >
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-4 h-4 text-blue-400" />
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-widest">12-Hour Temperature Trend</h3>
      </div>

      <div style={{ height: '160px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="precipGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}°`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#60a5fa"
              strokeWidth={2.5}
              fill="url(#tempGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#60a5fa', stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="precip"
              stroke="#38bdf8"
              strokeWidth={1.5}
              fill="url(#precipGrad)"
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 3, fill: '#38bdf8' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-400 rounded" />
          <span className="text-white/40 text-xs">Temperature</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded" style={{ background: '#38bdf8', borderTop: '1px dashed #38bdf8' }} />
          <span className="text-white/40 text-xs">Rain %</span>
        </div>
      </div>
    </motion.div>
  );
}
