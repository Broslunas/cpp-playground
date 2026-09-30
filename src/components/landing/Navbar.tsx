import React from "react";
import Link from "next/link";
import { Terminal, Play, ExternalLink, Sparkles, Code2 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#08090f]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-neon-green/40 shadow-[0_0_15px_rgba(0,255,136,0.25)] flex items-center justify-center bg-zinc-950 group-hover:border-neon-green transition-all">
            <svg viewBox="0 0 512 512" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 235 110 A 145 145 0 1 0 375 295 A 120 120 0 1 1 235 110 Z"
                fill="url(#navMoonGrad)"
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
                <linearGradient id="navMoonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00ff88" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-sm tracking-wide text-white group-hover:text-neon-green transition-colors">
              Broslunas <span className="text-neon-green font-extrabold">Playground</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500 -mt-1 hidden sm:block">
              Code Runner & IDE
            </span>
          </div>
        </Link>

        {/* Center Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
          <Link href="#runtimes" className="hover:text-zinc-100 transition-colors">
            Runtimes
          </Link>
          <Link href="#terminal" className="hover:text-zinc-100 transition-colors">
            Terminal en Vivo
          </Link>
          <Link href="#capacidades" className="hover:text-zinc-100 transition-colors">
            Capacidades
          </Link>
          <a
            href="https://broslunas.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-cyan transition-colors inline-flex items-center gap-1 text-zinc-400"
          >
            broslunas.com <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neon-green text-black font-mono font-bold text-xs hover:bg-[#00e67a] transition-all transform hover:scale-[1.02] shadow-[0_0_15px_rgba(0,255,136,0.3)]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Abrir Playground</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
