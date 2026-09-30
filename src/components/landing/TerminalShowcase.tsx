"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, CheckCircle2, CornerDownLeft, Terminal, Code2, Sparkles, Copy, Check } from "lucide-react";

interface Snippet {
  id: string;
  name: string;
  langTag: string;
  compiler: string;
  href: string;
  code: string;
  stdout: string[];
  execTime: string;
  badgeColor: string;
}

const SNIPPETS: Snippet[] = [
  {
    id: "cpp",
    name: "C++23",
    langTag: "main.cpp",
    compiler: "g++ -std=c++23 -O2 -Wall",
    href: "/cpp/playground",
    badgeColor: "text-neon-green border-neon-green/30 bg-neon-green/10",
    code: `#include <iostream>
#include <vector>
#include <ranges>

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5, 6};

    // C++20/23 Ranges pipeline
    auto evens = nums | std::views::filter([](int n) { return n % 2 == 0; });
    for (int n : evens) {
        std::cout << "» Broslunas C++23 Par: " << n << "\\n";
    }
    return 0;
}`,
    stdout: [
      "» Broslunas C++23 Par: 2",
      "» Broslunas C++23 Par: 4",
      "» Broslunas C++23 Par: 6",
    ],
    execTime: "0.082s",
  },
  {
    id: "python",
    name: "Python",
    langTag: "script.py",
    compiler: "python 3.12 -O",
    href: "/python/playground",
    badgeColor: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    code: `# Algoritmo de primos con Python 3.12
def criba(limite: int) -> list[int]:
    primos = [True] * (limite + 1)
    p = 2
    while p * p <= limite:
        if primos[p]:
            for i in range(p * p, limite + 1, p):
                primos[i] = False
        p += 1
    return [p for p in range(2, limite + 1) if primos[p]]

resultado = criba(25)
print(f"» Primos hasta 25: {resultado}")`,
    stdout: [
      "» Primos hasta 25: [2, 3, 5, 7, 11, 13, 17, 19, 23]",
    ],
    execTime: "0.038s",
  },
  {
    id: "typescript",
    name: "TypeScript",
    langTag: "app.ts",
    compiler: "tsc 5.6 & node v20",
    href: "/typescript/playground",
    badgeColor: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    code: `interface Proyecto {
    id: string;
    nombre: string;
    lenguajes: string[];
    esActivo: boolean;
}

const miProyecto: Proyecto = {
    id: "bl-01",
    nombre: "Broslunas Playground",
    lenguajes: ["C++", "Python", "TS", "Bash"],
    esActivo: true
};

console.log(\`» Entorno: \${miProyecto.nombre} cargado con \${miProyecto.lenguajes.length} runtimes\`);`,
    stdout: [
      "» Entorno: Broslunas Playground cargado con 4 runtimes",
    ],
    execTime: "0.045s",
  },
  {
    id: "javascript",
    name: "JavaScript",
    langTag: "server.js",
    compiler: "node --harmony v20.17",
    href: "/javascript/playground",
    badgeColor: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    code: `// Async pipeline con V8
async function simularTareas() {
    const tareas = [10, 20, 30].map(async (v, i) => {
        return \`Tarea #\${i + 1} completada en \${v}ms\`;
    });
    const resultados = await Promise.all(tareas);
    resultados.forEach(r => console.log(\`» \${r}\`));
}

simularTareas();`,
    stdout: [
      "» Tarea #1 completada en 10ms",
      "» Tarea #2 completada en 20ms",
      "» Tarea #3 completada en 30ms",
    ],
    execTime: "0.027s",
  },
  {
    id: "bash",
    name: "Linux Bash",
    langTag: "terminal.sh",
    compiler: "bash 5.2.21 (x86_64-linux)",
    href: "/bash/playground",
    badgeColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    code: `#!/bin/bash
# Kernel & Environment Info
echo "» Host: $(uname -s) Kernel: $(uname -r)"
echo "» CPU Cores: $(nproc) | Memory Free: $(free -m | awk '/Mem:/ {print $4}')MB"
for item in gcc clang python3 node bash; do
    printf "» Paquete instalado: %-10s [OK]\\n" "$item"
done`,
    stdout: [
      "» Host: Linux Kernel: 6.8.0-generic",
      "» CPU Cores: 4 | Memory Free: 1824MB",
      "» Paquete instalado: gcc        [OK]",
      "» Paquete instalado: clang      [OK]",
      "» Paquete instalado: python3    [OK]",
      "» Paquete instalado: node       [OK]",
      "» Paquete instalado: bash       [OK]",
    ],
    execTime: "0.015s",
  },
];

export function TerminalShowcase() {
  const [activeTab, setActiveTab] = useState<string>("cpp");
  const [copied, setCopied] = useState(false);

  const currentSnippet = SNIPPETS.find((s) => s.id === activeTab) || SNIPPETS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="terminal" className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-8">
        <h2 className="text-xs font-mono uppercase tracking-widest text-neon-green mb-2 flex items-center justify-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" /> Terminal Interactiva en Vivo
        </h2>
        <p className="text-2xl sm:text-3xl font-bold font-mono text-white">
          Inspecciona y prueba la salida en tiempo real
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#0c0e14] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Language Tabs bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#08090d] border-b border-zinc-800/80 overflow-x-auto gap-2">
          {/* Mac-style window dots */}
          <div className="flex items-center gap-1.5 shrink-0 pl-1 mr-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>

          {/* Snippet selector tabs */}
          <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
            {SNIPPETS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md transition-all text-xs font-medium flex items-center gap-1.5 ${
                    isActive
                      ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0 pr-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Copiar código"
              aria-label="Copiar código del snippet"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${currentSnippet.badgeColor}`}>
              {currentSnippet.compiler}
            </span>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm text-zinc-200 leading-relaxed overflow-x-auto bg-[#0a0c12]">
          <pre className="whitespace-pre">
            {currentSnippet.code}
          </pre>
        </div>

        {/* Output Panel Showcase */}
        <div className="border-t border-zinc-800 bg-[#06070a] p-4 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <CornerDownLeft className="w-3.5 h-3.5 text-neon-green" /> SALIDA ESTÁNDAR (stdout)
            </span>
            <span className="text-neon-green flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3 h-3" /> Exit Code: 0 ({currentSnippet.execTime})
            </span>
          </div>
          <div className="bg-black/70 rounded-lg p-3 text-neon-green space-y-1 font-mono text-xs border border-zinc-800/80">
            {currentSnippet.stdout.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>

        {/* CTA Bar */}
        <div className="px-4 py-3 bg-[#080a10] border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-mono text-zinc-400 text-center sm:text-left">
            ¿Quieres modificar y probar este código? Abre el entorno completo de {currentSnippet.name}.
          </span>
          <Link
            href={currentSnippet.href}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-neon-green/10 border border-neon-green/40 text-neon-green text-xs font-mono font-semibold hover:bg-neon-green hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,136,0.15)]"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Ejecutar {currentSnippet.name}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
