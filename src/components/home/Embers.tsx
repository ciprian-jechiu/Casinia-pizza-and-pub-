"use client";

import { useEffect, useRef } from "react";

type Ember = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; hue: number; seed: number };

/**
 * Scântei care urcă din gura cuptorului. Canvas 2D, se oprește când nu e vizibil
 * și nu rulează deloc la „reduce motion”.
 */
export function Embers({ originRef }: { originRef: React.RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    const embers: Ember[] = [];
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      const spread = o ? o.width * 0.45 : w * 0.3;
      const baseY = o ? o.top - c.top + o.height * 0.82 : h * 0.8;
      const max = 140 + Math.random() * 220;
      embers.push({
        x: cx + (Math.random() - 0.5) * 2 * spread,
        y: baseY + Math.random() * 30,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.5 + Math.random() * 1.3),
        r: 0.6 + Math.random() * 1.9,
        life: 0,
        max,
        hue: 22 + Math.random() * 22,
        seed: Math.random() * 1000,
      });
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const target = w < 640 ? 70 : 150;
      for (let i = 0; i < 3 && embers.length < target; i++) spawn();

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life++;
        // turbulență: drift sinusoidal + respingere ușoară de cursor
        e.vx += Math.sin(t * 0.0012 + e.seed) * 0.012;
        const dx = e.x - mouse.x, dy = e.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const f = (1 - d2 / 14000) * 0.35;
          e.vx += (dx / Math.sqrt(d2 + 1)) * f;
          e.vy += (dy / Math.sqrt(d2 + 1)) * f * 0.5;
        }
        e.vx *= 0.985;
        e.vy = e.vy * 0.995 - 0.004;
        e.x += e.vx;
        e.y += e.vy;
        const p = e.life / e.max;
        if (p >= 1 || e.y < -20) {
          embers.splice(i, 1);
          continue;
        }
        const alpha = Math.sin(Math.PI * p) * (0.55 + 0.45 * Math.sin(t * 0.01 + e.seed));
        const radius = e.r * (1 - p * 0.6);
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, radius * 6);
        g.addColorStop(0, `hsla(${e.hue + 10}, 100%, 75%, ${alpha})`);
        g.addColorStop(0.25, `hsla(${e.hue}, 95%, 55%, ${alpha * 0.55})`);
        g.addColorStop(1, `hsla(${e.hue - 10}, 90%, 40%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius * 6, 0, Math.PI * 2);
        ctx.fill();
      }
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
