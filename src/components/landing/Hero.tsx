import React from "react";
import Link from "next/link";
import {
  Terminal,
  Play,
  Cpu,
  Zap,
  Code2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Workflow,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-zinc-800/80">
      {/* Dynamic Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-gradient-to-tr from-neon-green/15 via-neon-cyan/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[350px] h-[300px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Cyber Grid background */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Release & Brand Status Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-neon-green/30 bg-neon-green/5 text-neon-green text-xs font-mono mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,136,0.15)] hover:border-neon-green/60 transition-all">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="font-semibold text-zinc-100">Broslunas Playground v1.2</span>
          <span className="text-zinc-500">•</span>
          <span className="text-neon-cyan">6 Runtimes Listos</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-300">Zero Configuración</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 font-mono leading-[1.1]">
          <span className="block text-zinc-200">El Playground Definitivo</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-teal-300 to-neon-cyan drop-shadow-[0_0_40px_rgba(0,255,136,0.35)]">
            Broslunas Playground
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-zinc-400 mb-10 leading-relaxed font-sans">
          Escribe, compila y ejecuta código en tiempo real con aislamiento total en la nube.
          Optimizado para <strong className="text-zinc-200">C++23</strong> con GCC y Clang,{" "}
          <strong className="text-yellow-300">Python</strong>,{" "}
          <strong className="text-blue-400">TypeScript</strong>,{" "}
          <strong className="text-amber-300">JavaScript</strong>,{" "}
          <strong className="text-cyan-300">HTML5/Canvas</strong> y{" "}
          <strong className="text-emerald-400">Linux Bash Terminal</strong>.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Link
            href="/playground"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-neon-green text-black font-mono font-bold text-sm hover:bg-[#00e67a] transition-all transform hover:-translate-y-0.5 shadow-[0_0_25px_rgba(0,255,136,0.35)] focus:outline-none focus:ring-2 focus:ring-neon-green"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Explorar Entornos</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            href="/cpp/playground"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-200 font-mono font-semibold text-sm hover:border-neon-green/50 hover:text-white transition-all transform hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4 text-neon-green" />
            <span>Lanzar C++ Nativo</span>
          </Link>
        </div>

        {/* Language selector cards grid */}
        <div id="runtimes" className="pt-2 pb-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-neon-green" /> Selecciona un entorno para comenzar
            </span>
            <Link
              href="/playground"
              className="text-xs font-mono text-neon-cyan hover:underline inline-flex items-center gap-1"
            >
              Ver todos en detalle →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* C++ */}
            <Link
              href="/cpp/playground"
              className="group p-3.5 rounded-xl border border-zinc-800 bg-[#0c0e15]/70 hover:border-neon-green/60 hover:bg-[#0e121c] transition-all flex flex-col items-center text-center shadow-sm hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neon-green/10 text-neon-green border border-neon-green/30 group-hover:scale-110 transition-transform mb-2">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <span className="font-mono font-bold text-sm text-zinc-100 group-hover:text-neon-green">C++</span>
              <span className="text-[11px] text-zinc-500 font-mono">GCC 14 / Clang</span>
              <span className="mt-2 text-[10px] font-mono text-neon-green px-1.5 py-0.5 rounded bg-neon-green/10">
                Nativo C++23
              </span>
            </Link>

            {/* Python */}
            <Link
              href="/python/playground"
              className="group p-3.5 rounded-xl border border-zinc-800 bg-[#0c0e15]/70 hover:border-yellow-400/60 hover:bg-[#0e121c] transition-all flex flex-col items-center text-center shadow-sm hover:shadow-[0_0_20px_rgba(250,204,21,0.15)]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 group-hover:scale-110 transition-transform mb-2">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="font-mono font-bold text-sm text-zinc-100 group-hover:text-yellow-400">Python</span>
              <span className="text-[11px] text-zinc-500 font-mono">CPython 3.12</span>
              <span className="mt-2 text-[10px] font-mono text-yellow-400 px-1.5 py-0.5 rounded bg-yellow-400/10">
                Interactivo
              </span>
            </Link>

            {/* TypeScript */}
            <Link
              href="/typescript/playground"
              className="group p-3.5 rounded-xl border border-zinc-800 bg-[#0c0e15]/70 hover:border-blue-400/60 hover:bg-[#0e121c] transition-all flex flex-col items-center text-center shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/30 group-hover:scale-110 transition-transform mb-2">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="font-mono font-bold text-sm text-zinc-100 group-hover:text-blue-400">TypeScript</span>
              <span className="text-[11px] text-zinc-500 font-mono">TS 5.6 Compiler</span>
              <span className="mt-2 text-[10px] font-mono text-blue-400 px-1.5 py-0.5 rounded bg-blue-400/10">
                Tipado Estricto
              </span>
            </Link>

            {/* JavaScript */}
            <Link
              href="/javascript/playground"
              className="group p-3.5 rounded-xl border border-zinc-800 bg-[#0c0e15]/70 hover:border-amber-400/60 hover:bg-[#0e121c] transition-all flex flex-col items-center text-center shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-mono font-bold text-sm text-zinc-100 group-hover:text-amber-400">JavaScript</span>
              <span className="text-[11px] text-zinc-500 font-mono">Node.js V8</span>
              <span className="mt-2 text-[10px] font-mono text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10">
                Async / Await
              </span>
            </Link>

            {/* HTML / CSS / Canvas */}
            <Link
              href="/html/playground"
              className="group p-3.5 rounded-xl border border-zinc-800 bg-[#0c0e15]/70 hover:border-cyan-400/60 hover:bg-[#0e121c] transition-all flex flex-col items-center text-center shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-mono font-bold text-sm text-zinc-100 group-hover:text-cyan-400">HTML5</span>
              <span className="text-[11px] text-zinc-500 font-mono">Canvas & DOM</span>
              <span className="mt-2 text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-400/10">
                Preview Vivo
              </span>
            </Link>

            {/* Linux Bash */}
            <Link
              href="/bash/playground"
              className="group p-3.5 rounded-xl border border-zinc-800 bg-[#0c0e15]/70 hover:border-emerald-400/60 hover:bg-[#0e121c] transition-all flex flex-col items-center text-center shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform mb-2">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-mono font-bold text-sm text-zinc-100 group-hover:text-emerald-400">Linux Bash</span>
              <span className="text-[11px] text-zinc-500 font-mono">Ubuntu Core</span>
              <span className="mt-2 text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-400/10">
                Shell & Pipes
              </span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-neon-green text-xs font-mono mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>ALTA VELOCIDAD</span>
            </div>
            <p className="text-zinc-200 text-sm font-semibold">Sub-segundo</p>
            <p className="text-zinc-400 text-xs">Ejecución en sandbox aislado</p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-neon-cyan text-xs font-mono mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>COMPILADORES</span>
            </div>
            <p className="text-zinc-200 text-sm font-semibold">GCC, Clang & V8</p>
            <p className="text-zinc-400 text-xs">Opciones -O2, -Wall y ASan</p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mb-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span>100% LOCAL</span>
            </div>
            <p className="text-zinc-200 text-sm font-semibold">LocalStorage</p>
            <p className="text-zinc-400 text-xs">Sin login ni tracking</p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ACCESIBILIDAD</span>
            </div>
            <p className="text-zinc-200 text-sm font-semibold">WCAG 2.1 AA</p>
            <p className="text-zinc-400 text-xs">Teclado y lectores de pantalla</p>
          </div>
        </div>
      </div>
    </section>
  );
}
