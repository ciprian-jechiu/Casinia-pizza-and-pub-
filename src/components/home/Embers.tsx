"use client";

import { useEffect, useRef } from "react";

type Ember = { x: number; y: number; vx: number; vy: number; s: number; life: number; max: number; seed: number; tone: number };

/** Pre-randează o scânteie (gradient radial) o singură dată; apoi doar o copiem — mult mai ieftin pe frame. */
function makeSprite(hueCore: string, hueMid: string) {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, hueCore);
  grad.addColorStop(0.18, hueMid);
  grad.addColorStop(1, "rgba(120,40,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/**
 * Scântei care urcă din gura cuptorului. Canvas 2D cu sprite-uri pre-randate,
 * se oprește când nu e vizibil și nu rulează deloc la „reduce motion”.
 */
export function Embers({ originRef }: { originRef: React.RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    const sprites = [
      makeSprite("rgba(255,235,190,1)", "rgba(255,150,50,.6)"),
      makeSprite("rgba(255,210,140,1)", "rgba(240,110,30,.55)"),
      makeSprite("rgba(255,245,215,1)", "rgba(255,180,90,.5)"),
    ];
    let w = 0, h = 0, raf = 0, visible = true, last = performance.now();
    const embers: Ember[] = [];
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => {
      const o = originRef.current?.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      const cx = o ? o.left - c.left + o.width / 2 : w / 2;
      const spread = o ? o.width * 0.32 : w * 0.25;
      const baseY = o ? o.top - c.top + o.height * 0.55 : h * 0.6;
      embers.push({
        x: cx + (Math.random() - 0.5) * 2 * spread,
        y: baseY + (Math.random() - 0.3) * (o ? o.height * 0.35 : 60),
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.6 + Math.random() * 1.4),
        s: 5 + Math.random() * 12,
        life: 0,
        max: 120 + Math.random() * 200,
        seed: Math.random() * 1000,
        tone: Math.floor(Math.random() * sprites.length),
      });
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      // pas de timp normalizat la 60fps, ca mișcarea să fie la fel pe ecrane de 60/120Hz
      const dt = Math.min((t - last) / 16.67, 3);
      last = t;
      const target = w < 640 ? 60 : 130;
      for (let i = 0; i < 2 && embers.length < target; i++) spawn();

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life += dt;
        e.vx += Math.sin(t * 0.0011 + e.seed) * 0.01 * dt;
        const dx = e.x - mouse.x, dy = e.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const f = (1 - d2 / 14000) * 0.3 * dt;
          const d = Math.sqrt(d2 + 1);
          e.vx += (dx / d) * f;
          e.vy += (dy / d) * f * 0.5;
        }
        e.vx *= 0.985;
        e.vy = e.vy * 0.996 - 0.003 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        const p = e.life / e.max;
        if (p >= 1 || e.y < -30) {
          embers.splice(i, 1);
          continue;
        }
        const alpha = Math.sin(Math.PI * p) * (0.6 + 0.4 * Math.sin(t * 0.008 + e.seed));
        const size = e.s * (1 - p * 0.55);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.drawImage(sprites[e.tone], e.x - size / 2, e.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const onMove = (ev: PointerEvent) => {
      const c = canvas.getBoundingClientRect();
      mouse.x = ev.clientX - c.left;
      mouse.y = ev.clientY - c.top;
    };
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [originRef]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
