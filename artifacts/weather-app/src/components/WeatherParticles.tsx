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

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number; y: number; size: number; speed: number;
      opacity: number; vx: number; life: number; maxLife: number;
    }

    const particles: Particle[] = [];
    const count = type === 'rain' ? 150 : type === 'snow' ? 80 : type === 'storm' ? 120 : type === 'drizzle' ? 60 : type === 'fog' ? 30 : type === 'clear' && isDay === 0 ? 200 : 0;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: type === 'snow' ? Math.random() * 4 + 1 : type === 'rain' || type === 'drizzle' ? Math.random() * 1.5 + 0.5 : Math.random() * 3 + 1,
        speed: type === 'rain' ? Math.random() * 8 + 8 : type === 'snow' ? Math.random() * 1.5 + 0.5 : type === 'drizzle' ? Math.random() * 4 + 4 : Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.6 + 0.2,
        vx: type === 'storm' ? (Math.random() - 0.5) * 4 : type === 'snow' ? (Math.random() - 0.5) * 1 : 0,
        life: Math.random() * Math.PI * 2,
        maxLife: Math.random() * 200 + 100,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      particles.forEach((p) => {
        p.life += 0.02;

        if (type === 'rain' || type === 'drizzle') {
          p.y += p.speed;
          p.x += p.vx;
          if (p.y > canvas!.height) { p.y = -20; p.x = Math.random() * canvas!.width; }
          ctx!.save();
          ctx!.globalAlpha = p.opacity * 0.6;
          ctx!.strokeStyle = type === 'drizzle' ? 'rgba(147,197,253,0.6)' : 'rgba(147,197,253,0.8)';
          ctx!.lineWidth = p.size * 0.5;
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(p.x + p.vx, p.y + p.speed * 1.5);
          ctx!.stroke();
          ctx!.restore();
        } else if (type === 'snow') {
          p.y += p.speed;
          p.x += Math.sin(p.life) * 0.5;
          if (p.y > canvas!.height) { p.y = -10; p.x = Math.random() * canvas!.width; }
          ctx!.save();
          ctx!.globalAlpha = p.opacity;
          ctx!.fillStyle = 'rgba(219,234,254,0.9)';
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        } else if (type === 'storm') {
          p.y += p.speed;
          p.x += p.vx + Math.sin(p.life) * 0.5;
          if (p.y > canvas!.height) { p.y = -20; p.x = Math.random() * canvas!.width; }
          ctx!.save();
          ctx!.globalAlpha = p.opacity * 0.5;
          ctx!.strokeStyle = 'rgba(148,163,184,0.6)';
          ctx!.lineWidth = 0.8;
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(p.x + p.vx * 2, p.y + p.speed * 2);
          ctx!.stroke();
          ctx!.restore();
        } else if (type === 'fog') {
          const pulsedOpacity = Math.sin(p.life) * 0.15 + p.opacity;
          p.x += 0.3;
          if (p.x > canvas!.width + 100) p.x = -100;
          ctx!.save();
          ctx!.globalAlpha = Math.max(0, Math.min(1, pulsedOpacity));
          const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 30);
          grad.addColorStop(0, 'rgba(203,213,225,0.25)');
          grad.addColorStop(1, 'rgba(203,213,225,0)');
          ctx!.fillStyle = grad;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 30, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        } else if (type === 'clear' && isDay === 0) {
          // Stars twinkling
          const tw = Math.sin(p.life) * 0.4 + 0.6;
          ctx!.save();
          ctx!.globalAlpha = p.opacity * tw;
          ctx!.fillStyle = 'rgba(255,255,255,0.9)';
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        }
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [type, isDay]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.8 }}
    />
  );
}
