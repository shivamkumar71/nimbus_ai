import { motion } from "framer-motion";
import { Cloud, Sun, CloudRain } from "lucide-react";

interface Props {
  message?: string;
}

export default function LoadingScreen({ message = "Fetching weather data..." }: Props) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #0c1a2e)' }}
    >
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', animation: 'float 4s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', animation: 'float 5s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated weather icons */}
        <div className="relative w-32 h-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl">☀️</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl">🌙</div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl">🌧️</div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl">❄️</div>
          </motion.div>
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center text-5xl"
          >
            🌍
          </motion.div>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400"
              animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

        <div className="text-center">
          <div className="gradient-text text-xl font-bold mb-2">SkyPulse</div>
          <div className="text-white/50 text-sm">{message}</div>
        </div>
      </div>
    </div>
  );
}
