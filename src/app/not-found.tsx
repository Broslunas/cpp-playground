"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Terminal,
  Home,
  ArrowLeft,
  Play,
  Code2,
  Cpu,
  CornerDownLeft,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

const QUICK_LANGS = [
  { name: "C++23", slug: "cpp", desc: "GCC HEAD / Clang", color: "text-neon-green border-neon-green/30 hover:border-neon-green" },
  { name: "Python", slug: "python", desc: "Python 3.12 + CPython", color: "text-neon-cyan border-neon-cyan/30 hover:border-neon-cyan" },
  { name: "TypeScript", slug: "typescript", desc: "Node & TS 5.6", color: "text-blue-400 border-blue-400/30 hover:border-blue-400" },
  { name: "Bash", slug: "bash", desc: "Linux Sandbox", color: "text-amber-400 border-amber-400/30 hover:border-amber-400" },
  { name: "HTML / JS", slug: "html", desc: "Live Web Preview", color: "text-orange-400 border-orange-400/30 hover:border-orange-400" },
  { name: "SQL", slug: "sql", desc: "SQLite In-Memory", color: "text-purple-400 border-purple-400/30 hover:border-purple-400" },
];

export default function NotFound() {
  const [copied, setCopied] = useState(false);

  const errorLog = `$ ejecuta run --route current
[RESOLVE_ERROR] 0x404_PAGE_NOT_FOUND
fatal error: route not resolved in virtual tree
call stack:
  at Router.dispatch (/core/router.ts:404:12)
  at handleRequest (/server/proxy.ts:88:5)
exit code: 127 (SIGSEGV / NULL_POINTER)`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(errorLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#08090f] text-zinc-100 selection:bg-neon-green/30 selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col justify-center items-center">
        {/* Glowing badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-neon-red/10 text-neon-red border border-neon-red/20 mb-6">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>ERROR 404: SEGMENTATION_FAULT EN RUTA</span>
        </div>

        {/* Big Code Heading */}
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-7xl sm:text-9xl font-black font-mono tracking-tighter bg-gradient-to-b from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            Ruta Desreferenciada o No Compilada
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
            El archivo o dirección que intentas ejecutar no existe en el sistema de archivos de ejecuta.tech.
          </p>
        </div>

        {/* Simulated Terminal Window */}
        <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#0c0e14] shadow-2xl overflow-hidden mb-8 font-mono text-xs">
          {/* Terminal Titlebar */}
          <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="ml-2 text-zinc-400 text-[11px] flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-neon-green" />
                bash - ejecuta.tech runtime (signal 127)
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              title="Copiar traza de error"
              aria-label="Copiar traza de error"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Terminal Body */}
          <div className="p-4 space-y-2 text-zinc-300 overflow-x-auto">
            <p className="text-zinc-400">
              <span className="text-neon-green font-bold">broslunas@ejecuta.tech</span>:<span className="text-neon-cyan">~</span>$ ejecuta run --route current
            </p>
            <p className="text-neon-red font-semibold">[RESOLVE_ERROR] 0x404_PAGE_NOT_FOUND</p>
            <p className="text-zinc-500 text-[11px]">fatal error: route not resolved in virtual tree</p>
            <div className="pl-3 border-l-2 border-zinc-800 text-zinc-500 text-[11px] space-y-0.5 my-2">
              <p>at Router.dispatch (/core/router.ts:404:12)</p>
              <p>at handleRequest (/server/proxy.ts:88:5)</p>
            </div>
            <p className="text-amber-400/90 text-[11px]">
              ➜ Sugerencia: reintenta desde el menú principal o inicia un nuevo playground.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-green text-black font-mono font-bold text-sm hover:bg-[#00e67a] transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,136,0.25)]"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>

          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-sm hover:text-white hover:border-neon-green/50 transition-all"
          >
            <Play className="w-4 h-4 text-neon-green fill-current" />
            <span>Abrir Playground</span>
          </Link>

          <button
            onClick={() => typeof window !== "undefined" && window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-400 font-mono text-sm hover:text-zinc-200 hover:border-zinc-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>
        </div>

        {/* Quick Language Launch Grid */}
        <div className="w-full max-w-2xl">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3 text-center">
            O compila directamente en tu entorno preferido:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {QUICK_LANGS.map((lang) => (
              <Link
                key={lang.slug}
                href={`/${lang.slug}/playground`}
                className={`flex flex-col p-3 rounded-lg bg-zinc-900/60 border ${lang.color} transition-all group`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-bold text-zinc-200 group-hover:text-white">
                    {lang.name}
                  </span>
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {lang.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
