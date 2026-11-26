"use client";

import { useEffect, useRef } from "react";

export function CanvasVisualizer({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const bars = 24;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const barW = width / bars;
      for (let i = 0; i < bars; i += 1) {
        const t = Date.now() / 220 + i * 0.6;
        const amp = active ? (Math.sin(t) * 0.5 + 0.5) * 0.8 + 0.2 : 0.08;
        const h = Math.max(2, amp * height);
        ctx.fillStyle = "rgba(34,211,238,0.55)";
        ctx.fillRect(i * barW + 1, height - h, Math.max(1, barW - 2), h);
      }
      raf = requestAnimationFrame(draw);
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      draw();
      cancelAnimationFrame(raf);
      return;
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={canvasRef} width={240} height={40} className="h-10 w-full max-w-[240px] rounded-md opacity-80" aria-hidden="true" />;
}
