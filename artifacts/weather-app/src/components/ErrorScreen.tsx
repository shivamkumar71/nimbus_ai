import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, MapPin } from "lucide-react";

interface Props {
  message: string;
  onRetry?: () => void;
  onGeolocate?: () => void;
}

export default function ErrorScreen({ message, onRetry, onGeolocate }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[300px] py-16 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>

      <h3 className="text-white text-xl font-bold mb-2">Oops! Something went wrong</h3>
      <p className="text-white/50 text-sm mb-8 max-w-sm">{message}</p>

      <div className="flex gap-3">
        {onGeolocate && (
          <button
            onClick={onGeolocate}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            <MapPin className="w-4 h-4" />
            Use My Location
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white/70 text-sm font-medium transition-all hover:text-white"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
}
