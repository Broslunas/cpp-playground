import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Terminal, ExternalLink, Heart, Shield, Code, Sparkles } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800/80 bg-[#06080d] py-12 text-zinc-400 font-mono text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top footer row: brand & navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-800/60">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 text-white group">
              {/* Custom Favicon SVG rendering */}
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-neon-green/40 shadow-[0_0_12px_rgba(0,255,136,0.25)] flex items-center justify-center bg-zinc-950">
                <svg viewBox="0 0 512 512" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M 235 110 A 145 145 0 1 0 375 295 A 120 120 0 1 1 235 110 Z"
                    fill="url(#footerMoonGrad)"
                  />
                  <path
                    d="M 220 195 L 285 256 L 220 317"
                    stroke="#ffffff"
                    strokeWidth="38"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="295"
                    y1="317"
                    x2="355"
                    y2="317"
                    stroke="#00ff88"
                    strokeWidth="38"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="footerMoonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ff88" />
                      <stop offset="100%" stopColor="#00d4ff" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="font-bold text-sm tracking-wider text-white">
                BROSLUNAS <span className="text-neon-green">PLAYGROUND</span>
              </span>
            </Link>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              Entorno web interactivo de ejecución de código para prototipado rápido, pruebas de algoritmos y aprendizaje en C++, Python, TypeScript, JavaScript, Bash y HTML.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span>Servidores y compiladores en línea</span>
            </div>
          </div>

          {/* Lenguajes */}
          <div>
            <h4 className="text-zinc-200 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-neon-green" /> Lenguajes
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/cpp/playground" className="hover:text-neon-green transition-colors">
                  C++ (GCC / Clang C++23)
                </Link>
              </li>
              <li>
                <Link href="/python/playground" className="hover:text-yellow-400 transition-colors">
                  Python (CPython 3.12)
                </Link>
              </li>
              <li>
                <Link href="/typescript/playground" className="hover:text-blue-400 transition-colors">
                  TypeScript 5.6
                </Link>
              </li>
              <li>
                <Link href="/javascript/playground" className="hover:text-amber-400 transition-colors">
                  JavaScript (Node V8)
                </Link>
              </li>
              <li>
                <Link href="/html/playground" className="hover:text-cyan-400 transition-colors">
                  HTML5 / CSS / Canvas
                </Link>
              </li>
              <li>
                <Link href="/bash/playground" className="hover:text-emerald-400 transition-colors">
                  Linux Terminal (Bash)
                </Link>
              </li>
            </ul>
          </div>

          {/* Enlaces y Recursos */}
          <div>
            <h4 className="text-zinc-200 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neon-cyan" /> Plataforma
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/playground" className="hover:text-neon-cyan transition-colors">
                  Selector de Entornos
                </Link>
              </li>
              <li>
                <a
                  href="https://broslunas.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1 text-neon-green"
                >
                  broslunas.com <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-zinc-500">100% Sin Registro Requerido</span>
              </li>
              <li>
                <span className="text-zinc-500">Persistencia en LocalStorage</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & attribution row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="text-zinc-400">
              © {currentYear} <strong className="text-zinc-200 font-semibold">Broslunas Playground</strong>. Todos los derechos reservados.
            </span>
          </div>

          {/* Obligatory footer attribution requested by user */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/80 shadow-sm">
            <span className="text-zinc-400 text-xs">Creado por</span>
            <a
              href="https://broslunas.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-green font-semibold hover:underline inline-flex items-center gap-1 transition-colors"
            >
              Broslunas
              <span className="text-zinc-500 font-normal">[broslunas.com]</span>
              <ExternalLink className="w-3 h-3 text-neon-green" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
