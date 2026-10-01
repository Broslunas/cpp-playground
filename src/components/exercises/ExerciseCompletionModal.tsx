"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, ListOrdered, Sparkles, X } from "lucide-react";
import { CppExercise } from "@/types";

interface ExerciseCompletionModalProps {
  exercise: CppExercise;
  nextExercise?: CppExercise | null;
  onNextExercise?: () => void;
  onClose: () => void;
  isLoadingNext?: boolean;
}

export function ExerciseCompletionModal({
  exercise,
  nextExercise,
  onNextExercise,
  onClose,
  isLoadingNext = false,
}: ExerciseCompletionModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti particle system via native Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const colors = ["#00ff88", "#22d3ee", "#fbbf24", "#f43f5e", "#a855f7", "#3b82f6", "#ffffff"];
    const particleCount = 90;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.4) - 20,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 8,
      opacity: 1,
    }));

    let startTime = performance.now();

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      const elapsed = (now - startTime) / 1000;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        if (elapsed > 2.5) {
          p.opacity = Math.max(0, p.opacity - 0.015);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (elapsed < 5) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none">
      {/* Confetti full-screen canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-10 w-full h-full"
      />

      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative z-20 w-full max-w-md bg-[#0a0d14] border border-neon-green/40 shadow-[0_0_50px_rgba(0,255,136,0.15)] rounded-2xl p-6 text-zinc-100 flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          title="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Badge */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-neon-green/10 border border-neon-green/40 flex items-center justify-center text-neon-green shadow-[0_0_20px_rgba(0,255,136,0.3)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-neon-green uppercase tracking-widest bg-neon-green/10 border border-neon-green/30 px-2.5 py-0.5 rounded-full">
            ¡Reto Superado!
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Ejercicio {exercise.number}
          </h2>
          <p className="text-xs text-zinc-300 font-medium">
            {exercise.title}
          </p>
          <p className="text-[11px] text-zinc-500 pt-1">
            Todos los casos de prueba han coincidido exactamente.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 pt-2">
          {nextExercise ? (
            <button
              type="button"
              disabled={isLoadingNext}
              onClick={onNextExercise}
              className="w-full py-3 px-4 rounded-xl bg-neon-green hover:bg-[#00e67a] active:bg-[#00cc6c] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all disabled:opacity-60 cursor-pointer"
            >
              <span>{isLoadingNext ? "Cargando siguiente..." : `Ir al siguiente reto (#${nextExercise.number})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-bold">
              🎉 ¡Has completado todos los ejercicios de Primeros Pasos!
            </div>
          )}

          <Link
            href="/cpp/primeros-pasos"
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 border border-zinc-800 transition-colors"
          >
            <ListOrdered className="w-4 h-4 text-cyan-400" />
            <span>Volver a primeros pasos</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors pt-1"
          >
            Quedarme en este editor
          </button>
        </div>
      </div>
    </div>
  );
}
