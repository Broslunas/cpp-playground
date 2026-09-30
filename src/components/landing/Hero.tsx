import React from "react";
import Link from "next/link";
import { Terminal, Play, Cpu, Zap, Code2 } from "lucide-react";

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
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neon-green/30 bg-neon-green/5 text-neon-green text-xs font-mono mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,136,0.15)] hover:border-neon-green/60 hover:bg-neon-green/10 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span>Multi-Language • C++23 • Python • HTML/CSS/JS • JavaScript →</span>
        </Link>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 font-mono">
          Tu playground de <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-teal-300 to-neon-cyan drop-shadow-[0_0_35px_rgba(0,255,136,0.3)]">
            programación moderno
          </span>{" "}
          en la web
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 mb-10 leading-relaxed">
          Escribe, compila y ejecuta en entornos aislados de alta velocidad. Elige tu lenguaje favorito
          con soporte completo para stdin, plantillas de algoritmos y proyectos locales en tu navegador.
        </p>

        {/* Call to actions by language */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            href="/cpp/playground"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-neon-green text-black font-semibold text-sm font-mono hover:bg-[#00e67a] transition-all transform hover:-translate-y-0.5 shadow-[0_0_20px_rgba(0,255,136,0.25)] focus:outline-none focus:ring-2 focus:ring-neon-green"
          >
            <Play className="w-4 h-4 fill-current" />
            C++
          </Link>
          <Link
            href="/python/playground"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-yellow-400 hover:text-yellow-300 hover:border-yellow-400/50 font-semibold text-sm font-mono transition-all transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(250,204,21,0.1)] focus:outline-none"
          >
            <Code2 className="w-4 h-4 text-yellow-400" />
            Python 🐍
          </Link>
          <Link
            href="/html/playground"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400 font-semibold text-sm font-mono transition-all transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(6,182,212,0.15)] focus:outline-none"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            HTML/CSS/JS 🌐
          </Link>
          <Link
            href="/javascript/playground"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 hover:border-amber-400 font-semibold text-sm font-mono transition-all transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(245,158,11,0.15)] focus:outline-none"
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            JavaScript (Node) ⚡
          </Link>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-neon-green text-xs font-mono mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>EJECUCIÓN</span>
            </div>
            <p className="text-zinc-200 text-sm font-medium">Sub-segundo en nube</p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-neon-cyan text-xs font-mono mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>COMPILADORES</span>
            </div>
            <p className="text-zinc-200 text-sm font-medium">GCC, Clang & CPython</p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-mono mb-1">
              <Code2 className="w-3.5 h-3.5" />
              <span>RUTAS DEDICADAS</span>
            </div>
            <p className="text-zinc-200 text-sm font-medium">/[lang]/playground</p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>PROYECTOS</span>
            </div>
            <p className="text-zinc-200 text-sm font-medium">100% LocalStorage</p>
          </div>
        </div>
      </div>
    </section>
  );
}
