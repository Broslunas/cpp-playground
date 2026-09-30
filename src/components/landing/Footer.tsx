import React from "react";
import Link from "next/link";
import { Terminal, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-[#07080c] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-neon-green" />
          <span className="font-mono font-bold text-white tracking-wider text-sm">
            C++ PLAYGROUND
          </span>
          <span className="text-xs text-zinc-500 font-mono ml-2">
            v1.0.0
          </span>
        </div>

        <p className="text-xs text-zinc-500 font-mono text-center">
          Desarrollado para la comunidad de desarrolladores de C++. Impulsado por Wandbox API.
        </p>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <Link
            href="/playground"
            className="hover:text-neon-green transition-colors"
          >
            Playground
          </Link>
          <span>•</span>
          <a
            href="https://isocpp.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-cyan transition-colors"
          >
            ISO C++
          </a>
        </div>
      </div>
    </footer>
  );
}
