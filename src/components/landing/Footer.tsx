import React from "react";
import Link from "next/link";
import { Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-[#07080c] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-neon-green" />
          <span className="font-mono font-bold text-white tracking-wider text-sm">
            CODE PLAYGROUND
          </span>
          <span className="text-xs text-zinc-500 font-mono ml-2">
            v1.1.0
          </span>
        </div>

        <p className="text-xs text-zinc-500 font-mono text-center">
          Entorno de ejecución y prototipado multilingüe. Impulsado por Wandbox API.
        </p>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <Link
            href="/playground"
            className="hover:text-neon-cyan transition-colors"
          >
            Selector de Entornos
          </Link>
          <span>•</span>
          <Link
            href="/cpp/playground"
            className="hover:text-neon-green transition-colors"
          >
            C++
          </Link>
          <span>•</span>
          <Link
            href="/python/playground"
            className="hover:text-yellow-400 transition-colors"
          >
            Python
          </Link>
          <span>•</span>
          <Link
            href="/html/playground"
            className="hover:text-cyan-400 transition-colors"
          >
            HTML/CSS/JS
          </Link>
          <span>•</span>
          <Link
            href="/javascript/playground"
            className="hover:text-amber-400 transition-colors"
          >
            JavaScript
          </Link>
          <span>•</span>
          <Link
            href="/typescript/playground"
            className="hover:text-blue-400 transition-colors"
          >
            TypeScript
          </Link>
        </div>
      </div>
    </footer>
  );
}
