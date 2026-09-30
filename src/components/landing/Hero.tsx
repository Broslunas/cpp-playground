import React from "react";
import Link from "next/link";
import { Terminal, Play, Cpu, ShieldCheck, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-zinc-800/80">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-neon-green/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-neon-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-green/30 bg-neon-green/5 text-neon-green text-xs font-mono mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,136,0.15)]">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span>C++23 • GCC & Clang • Ejecución en la Nube</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 font-mono">
          Tu entorno de <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-teal-300 to-neon-cyan drop-shadow-[0_0_35px_rgba(0,255,136,0.3)]">
            C++ moderno
          </span>{" "}
          en la web
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 mb-10 leading-relaxed">
          Escribe, compila y ejecuta código C++ al instante. Con soporte completo
          para entrada estándar (stdin), depuración de errores, múltiples
          compiladores y proyectos guardados localmente en tu navegador.
        </p>

        {/* Call to actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/playground"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-neon-green text-black font-semibold text-base font-mono hover:bg-[#00e67a] transition-all transform hover:-translate-y-0.5 shadow-[0_0_25px_rgba(0,255,136,0.35)] focus:outline-none focus:ring-2 focus:ring-neon-green focus:ring-offset-2 focus:ring-offset-[#090a0f]"
          >
            <Play className="w-5 h-5 fill-current" />
            Entrar al Playground
          </Link>
          <a
            href="#caracteristicas"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-zinc-900/80 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <Terminal className="w-4 h-4 text-neon-cyan" />
            Ver Características
          </a>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-neon-green text-xs font-mono mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>COMPILACIÓN</span>
            </div>
            <p className="text-zinc-200 text-sm font-medium">Sub-segundo</p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-neon-cyan text-xs font-mono mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>ESTÁNDARES</span>
            </div>
            <p className="text-zinc-200 text-sm font-medium">C++11 hasta C++23</p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-neon-green text-xs font-mono mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>ENTRADA/SALIDA</span>
            </div>
            <p className="text-zinc-200 text-sm font-medium">stdin, out, err</p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-neon-cyan text-xs font-mono mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PRIVACIDAD</span>
            </div>
            <p className="text-zinc-200 text-sm font-medium">Guardado Local</p>
          </div>
        </div>
      </div>
    </section>
  );
}
