import { useEffect, useRef } from "react";

interface Props {
  type: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog' | 'drizzle';
  isDay: number;
}

export default function WeatherParticles({ type, isDay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Particle types ────────────────────────────────────────────────────────

    interface Drop {
      x: number; y: number; speed: number; len: number;
      opacity: number; vx: number;
    }

    interface Flake {
      x: number; y: number; r: number; speed: number;
      opacity: number; swing: number; phase: number;
    }

    interface FogBlob {
      x: number; y: number; r: number; opacity: number;
      speed: number; phase: number;
    }

    interface Star {
      x: number; y: number; r: number; opacity: number;
      phase: number; dur: number;
    }

    // ── Rain drops ────────────────────────────────────────────────────────────
    const rainDrops: Drop[] = [];
    if (type === 'rain' || type === 'drizzle' || type === 'storm') {
      const count = type === 'storm' ? 280 : type === 'rain' ? 180 : 70;
      const angle = type === 'storm' ? 18 : type === 'rain' ? 8 : 2;
      for (let i = 0; i < count; i++) {
        const speed = type === 'storm' ? 18 + Math.random() * 10
                    : type === 'rain'   ? 14 + Math.random() * 8
                    :                     6  + Math.random() * 4;
        rainDrops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed,
          len: type === 'storm' ? 24 + Math.random() * 20
             : type === 'rain'  ? 16 + Math.random() * 12
             :                     8 + Math.random() * 8,
          opacity: 0.35 + Math.random() * 0.45,
          vx: (Math.sin((angle * Math.PI) / 180) * speed) * (type === 'storm' ? 1.2 : 0.8),
        });
      }
    }

    // ── Snow flakes ───────────────────────────────────────────────────────────
    const snowFlakes: Flake[] = [];
    if (type === 'snow') {
      for (let i = 0; i < 100; i++) {
        snowFlakes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 1.5 + Math.random() * 3.5,
          speed: 0.8 + Math.random() * 1.8,
          opacity: 0.5 + Math.random() * 0.5,
          swing: 0.6 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // ── Fog blobs ─────────────────────────────────────────────────────────────
    const fogBlobs: FogBlob[] = [];
    if (type === 'fog') {
      for (let i = 0; i < 22; i++) {
        fogBlobs.push({
          x: Math.random() * canvas.width,
          y: canvas.height * (0.2 + Math.random() * 0.7),
          r: 80 + Math.random() * 160,
          opacity: 0.08 + Math.random() * 0.12,
          speed: 0.15 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // ── Night stars (canvas layer — subtle twinkle complement to SVG stars) ──
    const nightStars: Star[] = [];
    if (isDay === 0 && (type === 'clear' || type === 'cloudy')) {
      for (let i = 0; i < 60; i++) {
        nightStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.65,
          r: 0.4 + Math.random() * 1.2,
          opacity: 0.3 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
          dur: 0.008 + Math.random() * 0.012,
        });
      }
    }

    let frame = 0;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // ── Rain / Drizzle / Storm ───────────────────────────────────────────
      rainDrops.forEach(d => {
        d.y += d.speed;
        d.x += d.vx;
        if (d.y > canvas.height + 30) {
          d.y = -30;
          d.x = Math.random() * canvas.width;
        }
        if (d.x > canvas.width + 20) d.x -= canvas.width + 40;
        if (d.x < -20) d.x += canvas.width + 40;

        ctx.save();
        ctx.globalAlpha = d.opacity * (type === 'storm' ? 0.55 : 0.65);
        ctx.strokeStyle = type === 'storm'
          ? 'rgba(160,185,220,0.9)'
          : type === 'drizzle'
          ? 'rgba(170,210,255,0.7)'
          : 'rgba(150,200,255,0.85)';
        ctx.lineWidth = type === 'storm' ? 1.0 : type === 'rain' ? 0.85 : 0.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.vx * 1.2, d.y + d.len);
        ctx.stroke();
        ctx.restore();
      });

      // ── Snow ───────────────────────────────────────────────────────────
      snowFlakes.forEach(f => {
        f.phase += 0.018;
        f.y += f.speed;
        f.x += Math.sin(f.phase) * f.swing * 0.4;
        if (f.y > canvas.height + 10) {
          f.y = -10;
          f.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.globalAlpha = f.opacity;
        // Draw a 6-point snowflake for larger ones, circle for small
        if (f.r > 2.5) {
          ctx.strokeStyle = 'rgba(220,235,255,0.9)';
          ctx.lineWidth = 0.8;
          for (let a = 0; a < 6; a++) {
            const angle = (a * 60 * Math.PI) / 180;
            ctx.beginPath();
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(f.x + Math.cos(angle) * f.r * 1.8, f.y + Math.sin(angle) * f.r * 1.8);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(240,248,255,0.95)';
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(220,235,255,0.9)';
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // ── Fog ────────────────────────────────────────────────────────────
      fogBlobs.forEach(b => {
        b.phase += 0.004;
        b.x += b.speed;
        if (b.x - b.r > canvas.width + 50) b.x = -b.r;
        const pulse = Math.sin(b.phase) * 0.04;
        ctx.save();
        ctx.globalAlpha = Math.max(0, b.opacity + pulse);
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, 'rgba(200,215,235,0.5)');
        g.addColorStop(0.5, 'rgba(180,200,225,0.2)');
        g.addColorStop(1, 'rgba(180,200,225,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.r, b.r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── Night stars ────────────────────────────────────────────────────
      nightStars.forEach(s => {
        s.phase += s.dur;
        const tw = (Math.sin(s.phase) * 0.45 + 0.55);
        ctx.save();
        ctx.globalAlpha = s.opacity * tw;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [type, isDay]);

  const visible = type === 'rain' || type === 'drizzle' || type === 'storm'
    || type === 'snow' || type === 'fog' || (isDay === 0);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[2]"
      style={{ opacity: 1 }}
    />
  );
}
