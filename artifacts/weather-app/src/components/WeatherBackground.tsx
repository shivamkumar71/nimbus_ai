import { useEffect, useState } from "react";

interface Props {
  gradient: string;
  particleType: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog' | 'drizzle';
  isDay: number;
}

export default function WeatherBackground({ gradient, particleType, isDay }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Main gradient */}
      <div
        className="absolute inset-0 weather-bg-transition"
        style={{ background: gradient }}
      />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {particleType === 'clear' && isDay === 1 && (
          <>
            <div
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(253,224,71,0.8) 0%, rgba(251,191,36,0.4) 40%, transparent 70%)',
                animation: 'float 6s ease-in-out infinite',
              }}
            />
            <div
              className="absolute top-16 right-8 w-64 h-64 rounded-full opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(253,224,71,0.6) 0%, transparent 70%)',
                animation: 'float 4s ease-in-out infinite 1s',
              }}
            />
            {/* Sun rays */}
            <div
              className="absolute -top-20 -right-20 w-96 h-96 opacity-10"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg 10deg, rgba(253,224,71,0.8) 10deg 15deg, transparent 15deg 30deg, rgba(253,224,71,0.8) 30deg 35deg, transparent 35deg 360deg)',
                animation: 'sun-rotate 30s linear infinite',
              }}
            />
          </>
        )}

        {particleType === 'clear' && isDay === 0 && (
          <>
            <div
              className="absolute top-8 right-16 w-32 h-32 rounded-full opacity-40"
              style={{
                background: 'radial-gradient(circle, rgba(226,232,240,0.9) 0%, rgba(148,163,184,0.3) 60%, transparent 70%)',
                animation: 'float 8s ease-in-out infinite',
              }}
            />
            {/* Aurora effect */}
            <div className="absolute inset-0 opacity-20"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.3) 50%, transparent 100%)',
                animation: 'fog-drift 10s ease-in-out infinite',
              }}
            />
          </>
        )}

        {(particleType === 'cloudy' || particleType === 'fog') && (
          <>
            <div
              className="absolute top-20 left-1/4 w-64 h-32 rounded-full opacity-20"
              style={{
                background: 'radial-gradient(ellipse, rgba(203,213,225,0.8) 0%, transparent 70%)',
                animation: 'cloud-drift 8s ease-in-out infinite',
              }}
            />
            <div
              className="absolute top-40 right-1/4 w-80 h-40 rounded-full opacity-15"
              style={{
                background: 'radial-gradient(ellipse, rgba(203,213,225,0.8) 0%, transparent 70%)',
                animation: 'cloud-drift 10s ease-in-out infinite reverse',
              }}
            />
          </>
        )}

        {(particleType === 'rain' || particleType === 'drizzle') && (
          <>
            <div
              className="absolute -top-10 left-0 right-0 h-32 opacity-30"
              style={{
                background: 'linear-gradient(180deg, rgba(59,130,246,0.4) 0%, transparent 100%)',
              }}
            />
            <div
              className="absolute top-10 left-1/3 w-96 h-48 rounded-full opacity-10"
              style={{
                background: 'radial-gradient(ellipse, rgba(148,163,184,0.9) 0%, transparent 70%)',
                animation: 'cloud-drift 7s ease-in-out infinite',
              }}
            />
          </>
        )}

        {particleType === 'storm' && (
          <>
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: 'radial-gradient(ellipse at 50% 20%, rgba(167,139,250,0.5) 0%, transparent 60%)',
                animation: 'lightning 5s ease-in-out infinite',
              }}
            />
            <div
              className="absolute top-0 left-1/2 w-1 opacity-20"
              style={{
                background: 'linear-gradient(180deg, rgba(167,139,250,0.9) 0%, transparent 100%)',
                height: '40%',
                animation: 'lightning 7s ease-in-out infinite 2s',
              }}
            />
          </>
        )}

        {particleType === 'snow' && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(219,234,254,0.6) 0%, transparent 60%)',
            }}
          />
        )}
      </div>

      {/* Bottom gradient overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px',
        }}
      />

      {mounted && null}
    </div>
  );
}
