"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Terminal,
  Play,
  Cpu,
  Zap,
  Code2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderOpen,
  CornerDownLeft,
  ChevronRight,
  ChevronDown,
  Flame,
  Binary,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { SupportedLanguage, Project } from "@/types";
import { getProjects } from "@/lib/projects";

export const ALL_LANGUAGES: SupportedLanguage[] = [
  "cpp",
  "python",
  "html",
  "javascript",
  "typescript",
  "bash",
];

interface LanguageProfile {
  id: SupportedLanguage;
  name: string;
  badge: string;
  version: string;
  shortDesc: string;
  accentColor: string;
  accentBorder: string;
  glowColor: string;
  gradientText: string;
  iconBg: string;
  bannerBg: string;
  keyNumber: string;
  keyLetter: string;
  href: string;
  engine: string;
  sampleCode: string;
  sampleOutput: {
    stdout: string[];
    execTime: string;
  };
  templates: { title: string; desc: string }[];
}

const LANGUAGES_DATA: Record<SupportedLanguage, LanguageProfile> = {
  cpp: {
    id: "cpp",
    name: "C++",
    badge: "Nativo",
    version: "C++23 • GCC 14",
    shortDesc: "Compilador nativo, punteros, C++23 ranges y sanitizers ASan/UBSan.",
    accentColor: "#00ff88",
    accentBorder: "border-[#00ff88]/40 hover:border-[#00ff88]",
    glowColor: "rgba(0, 255, 136, 0.2)",
    gradientText: "from-[#00ff88] via-[#00d4ff] to-[#38bdf8]",
    iconBg: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30",
    bannerBg: "from-[#00ff88]/10 to-transparent",
    keyNumber: "1",
    keyLetter: "C",
    href: "/cpp/playground",
    engine: "GCC 14 / Clang 19",
    sampleCode: `#include <iostream>
#include <vector>
#include <ranges>

int main() {
    std::vector<int> nums = {10, 20, 30, 40};
    auto evens = nums | std::views::filter([](int n){ return n > 15; });
    for (int n : evens) std::cout << "» Val: " << n << "\\n";
    return 0;
}`,
    sampleOutput: {
      stdout: ["» Val: 20", "» Val: 30", "» Val: 40"],
      execTime: "0.012s",
    },
    templates: [
      { title: "Hola Mundo & I/O", desc: "std::cin / std::cout" },
      { title: "C++20 Ranges", desc: "Pipeline funcional" },
      { title: "Algoritmos DSA", desc: "Vectores y ordenación" },
    ],
  },
  python: {
    id: "python",
    name: "Python",
    badge: "JIT / 3.12",
    version: "CPython 3.12 • PyPy",
    shortDesc: "Sintaxis limpia, desarrollo veloz, análisis y scripting dinámico.",
    accentColor: "#facc15",
    accentBorder: "border-[#facc15]/40 hover:border-[#facc15]",
    glowColor: "rgba(250, 204, 21, 0.2)",
    gradientText: "from-[#facc15] via-[#fbbf24] to-[#38bdf8]",
    iconBg: "bg-[#facc15]/10 text-[#facc15] border-[#facc15]/30",
    bannerBg: "from-[#facc15]/10 to-transparent",
    keyNumber: "2",
    keyLetter: "P",
    href: "/python/playground",
    engine: "CPython 3.12.7",
    sampleCode: `import sys

def procesar(datos):
    filtrados = [x for x in datos if x > 15]
    print(f"» Python {sys.version.split()[0]} listo")
    for n in filtrados:
        print(f"  Item: {n}")

if __name__ == "__main__":
    procesar([10, 20, 30, 40])`,
    sampleOutput: {
      stdout: ["» Python 3.12.7 listo", "  Item: 20", "  Item: 30", "  Item: 40"],
      execTime: "0.024s",
    },
    templates: [
      { title: "I/O & F-Strings", desc: "Lectura rápida stdin" },
      { title: "Comprehensions", desc: "List & dict maps" },
      { title: "Generadores", desc: "Streams con yield" },
    ],
  },
  html: {
    id: "html",
    name: "HTML / Web",
    badge: "Live DOM",
    version: "HTML5 • CSS3 • JS",
    shortDesc: "Renderizado reactivo en sandbox seguro con manipulación de DOM y Canvas.",
    accentColor: "#ff5722",
    accentBorder: "border-[#ff5722]/40 hover:border-[#ff5722]",
    glowColor: "rgba(255, 87, 34, 0.2)",
    gradientText: "from-[#ff5722] via-[#f97316] to-[#facc15]",
    iconBg: "bg-[#ff5722]/10 text-[#ff5722] border-[#ff5722]/30",
    bannerBg: "from-[#ff5722]/10 to-transparent",
    keyNumber: "3",
    keyLetter: "H",
    href: "/html/playground",
    engine: "Navegador Nativo",
    sampleCode: `<!DOCTYPE html>
<html>
<body style="background:#0b0d14;color:#00ff88;font-family:monospace;padding:12px;">
  <h3>⚡ Live Web Canvas</h3>
  <button onclick="console.log('Click!')" style="padding:6px 12px;background:#00ff88;color:#000;font-weight:bold;border:none;border-radius:4px;">
    Ejecutar Evento
  </button>
</body>
</html>`,
    sampleOutput: {
      stdout: ["» Live DOM iframe listo", "  Event listeners conectados", "  Console log en vivo"],
      execTime: "0.001s",
    },
    templates: [
      { title: "UI Card Neon", desc: "Flexbox & Tailwind" },
      { title: "Canvas 2D", desc: "Animación por frames" },
      { title: "Interactividad", desc: "Eventos DOM básicos" },
    ],
  },
  javascript: {
    id: "javascript",
    name: "JavaScript",
    badge: "Node.js V8",
    version: "Node 20 • ES2023",
    shortDesc: "Backend script con V8 de Node.js, soporte async/await y streams.",
    accentColor: "#38bdf8",
    accentBorder: "border-[#38bdf8]/40 hover:border-[#38bdf8]",
    glowColor: "rgba(56, 189, 248, 0.2)",
    gradientText: "from-[#38bdf8] via-[#818cf8] to-[#c084fc]",
    iconBg: "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30",
    bannerBg: "from-[#38bdf8]/10 to-transparent",
    keyNumber: "4",
    keyLetter: "J",
    href: "/javascript/playground",
    engine: "Node.js 20.17.0 LTS",
    sampleCode: `async function main() {
    const nums = [10, 20, 30, 40];
    const evens = nums.filter(x => x > 15);
    console.log("» Node.js V8 listo: " + process.version);
    evens.forEach(n => console.log("  Node item: " + n));
}
main();`,
    sampleOutput: {
      stdout: ["» Node.js V8 listo: v20.17.0", "  Node item: 20", "  Node item: 30", "  Node item: 40"],
      execTime: "0.029s",
    },
    templates: [
      { title: "Async / Await", desc: "Promesas concurrentes" },
      { title: "Estructuras Map/Set", desc: "Colecciones modernas" },
      { title: "Streams Stdin", desc: "Entrada por línea" },
    ],
  },
  typescript: {
    id: "typescript",
    name: "TypeScript",
    badge: "Tipado Estático",
    version: "TS 5.6 • Node V8",
    shortDesc: "Tipado estático con interfaces, genéricos, uniones discriminadas y compiler de TypeScript 5.6.",
    accentColor: "#3178c6",
    accentBorder: "border-[#3178c6]/40 hover:border-[#3178c6]",
    glowColor: "rgba(49, 120, 198, 0.2)",
    gradientText: "from-[#3178c6] via-[#60a5fa] to-[#93c5fd]",
    iconBg: "bg-[#3178c6]/10 text-[#3178c6] border-[#3178c6]/30",
    bannerBg: "from-[#3178c6]/10 to-transparent",
    keyNumber: "5",
    keyLetter: "T",
    href: "/typescript/playground",
    engine: "TypeScript 5.6.2",
    sampleCode: `interface Usuario {
    id: number;
    nombre: string;
    rol: "admin" | "dev";
}

const u: Usuario = { id: 1, nombre: "Ada Lovelace", rol: "dev" };
console.log(\`» TS 5.6 cargado: \${u.nombre} [\${u.rol}]\`);`,
    sampleOutput: {
      stdout: ["» TS 5.6 cargado: Ada Lovelace [dev]"],
      execTime: "0.035s",
    },
    templates: [
      { title: "Uniones Discriminadas", desc: "Pattern matching seguro" },
      { title: "Fluent Builder", desc: "Generics encadenados" },
      { title: "Utility Types", desc: "Pick, Omit, Partial" },
    ],
  },
  bash: {
    id: "bash",
    name: "Linux Terminal (Bash)",
    badge: "Ubuntu Core",
    version: "Bash 5.2 • Linux 6.8",
    shortDesc: "Shell interactivo en contenedor Linux con comandos coreutils (grep, awk, sed, pipes y subshells).",
    accentColor: "#10b981",
    accentBorder: "border-[#10b981]/40 hover:border-[#10b981]",
    glowColor: "rgba(16, 185, 129, 0.2)",
    gradientText: "from-[#10b981] via-[#34d399] to-[#6ee7b7]",
    iconBg: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30",
    bannerBg: "from-[#10b981]/10 to-transparent",
    keyNumber: "6",
    keyLetter: "B",
    href: "/bash/playground",
    engine: "GNU Bash 5.2 (Ubuntu)",
    sampleCode: `#!/usr/bin/env bash
echo "» Linux Kernel: $(uname -r)"
echo "» Usuario: $(whoami) en $(pwd)"
ls -la / | head -n 4`,
    sampleOutput: {
      stdout: ["» Linux Kernel: 6.8.0-137-generic", "» Usuario: wandbox en /home/wandbox", "total 64"],
      execTime: "0.015s",
    },
    templates: [
      { title: "Diagnóstico Linux", desc: "CPU, memoria, disco y red" },
      { title: "Pipes & Awk/Sed", desc: "Procesamiento de texto" },
      { title: "Scripts CLI", desc: "Condicionales y argumentos" },
    ],
  },
};

const UPCOMING_LANGUAGES = [
  { name: "Rust", icon: "🦀", version: "1.82+", tag: "Borrow Checker" },
  { name: "Go", icon: "🦫", version: "1.23+", tag: "Goroutines" },
  { name: "Java", icon: "☕", version: "OpenJDK 22", tag: "Virtual Threads" },
  { name: "Zig", icon: "⚡", version: "0.13+", tag: "Zero Overhead" },
];

export function LanguageSelector() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>("cpp");
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimOutput, setShowSimOutput] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);

  const recentProjects = showAllProjects ? allProjects : allProjects.slice(0, 4);

  const activeLangData = useMemo(() => LANGUAGES_DATA[selectedLang], [selectedLang]);

  useEffect(() => {
    try {
      const projects = getProjects();
      setAllProjects(projects);
    } catch {
      // ignore
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "1" || key === "c") {
        setSelectedLang("cpp");
      } else if (key === "2" || key === "p") {
        setSelectedLang("python");
      } else if (key === "3" || key === "h") {
        setSelectedLang("html");
      } else if (key === "4" || key === "j") {
        setSelectedLang("javascript");
      } else if (key === "5" || key === "t") {
        setSelectedLang("typescript");
      } else if (key === "6" || key === "b") {
        setSelectedLang("bash");
      } else if (key === "arrowleft") {
        setSelectedLang((prev) => {
          const idx = ALL_LANGUAGES.indexOf(prev);
          return ALL_LANGUAGES[(idx - 1 + ALL_LANGUAGES.length) % ALL_LANGUAGES.length];
        });
      } else if (key === "arrowright") {
        setSelectedLang((prev) => {
          const idx = ALL_LANGUAGES.indexOf(prev);
          return ALL_LANGUAGES[(idx + 1) % ALL_LANGUAGES.length];
        });
      } else if (key === "enter") {
        router.push(LANGUAGES_DATA[selectedLang].href);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLang, router]);

  const handleSimulateRun = () => {
    setIsSimulating(true);
    setShowSimOutput(false);
    setTimeout(() => {
      setIsSimulating(false);
      setShowSimOutput(true);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-mono selection:bg-neon-green/30 selection:text-white">
      {/* Compact Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-[#080a10] px-3 sm:px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded bg-zinc-900 border border-zinc-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
            <Terminal className="w-3.5 h-3.5 text-neon-green" />
            <span>BROSLUNAS PLAYGROUND</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 font-normal">SELECTOR DE ENTORNO</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400">{ALL_LANGUAGES.length} Runtimes Online</span>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px]">
            <span>Atajos:</span>
            {ALL_LANGUAGES.map((_, i) => (
              <kbd key={i} className="px-1 bg-zinc-800 rounded text-zinc-300 font-bold">
                {i + 1}
              </kbd>
            ))}
            <span>•</span>
            <kbd className="px-1 bg-zinc-800 rounded text-zinc-300 font-bold">Enter</kbd>
          </div>
        </div>
      </header>

      {/* Main Container - Compact and Focused */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
        {/* TOP SECTION: Proyectos Recientes (Arriba del Todo) */}
        <section className="bg-[#0b0e15] border border-zinc-800/90 rounded-xl p-3 sm:p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <FolderOpen className="w-3.5 h-3.5 text-neon-cyan" />
              <span>TUS PROYECTOS</span>
              {allProjects.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                  {allProjects.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {allProjects.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllProjects((prev) => !prev)}
                  className="text-[11px] font-mono text-neon-green hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-neon-green/30 hover:bg-neon-green/10 transition-colors"
                >
                  <span>
                    {showAllProjects
                      ? "Ver menos proyectos"
                      : `Ver más proyectos (${allProjects.length})`}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showAllProjects ? "rotate-180 text-neon-green" : "text-neon-green"
                    }`}
                  />
                </button>
              )}
              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                Almacenamiento local del navegador
              </span>
            </div>
          </div>

          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {recentProjects.map((p) => {
                const pLang = p.language || "cpp";
                const badgeColor =
                  pLang === "cpp"
                    ? "bg-neon-green/10 text-neon-green border-neon-green/20"
                    : pLang === "python"
                    ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                    : pLang === "html"
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    : pLang === "javascript"
                    ? "bg-sky-400/10 text-sky-400 border-sky-400/20"
                    : pLang === "typescript"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : pLang === "bash"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700";
                return (
                  <Link
                    key={p.id}
                    href={`/${pLang}/playground`}
                    className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}
                      >
                        {pLang.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(p.updatedAt).toLocaleDateString(undefined, {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                      {p.name}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 group-hover:text-zinc-300">
                      <span>Abrir</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-2.5 px-3 rounded-lg bg-black/20 border border-zinc-800/40 flex items-center justify-between text-xs text-zinc-400">
              <span className="text-zinc-500">
                Aún no tienes proyectos guardados. Selecciona un entorno para comenzar:
              </span>
              <div className="flex gap-2">
                <Link
                  href="/cpp/playground"
                  className="text-neon-green hover:underline text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Nuevo C++
                </Link>
                <span className="text-zinc-600">•</span>
                <Link
                  href="/python/playground"
                  className="text-yellow-400 hover:underline text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Nuevo Python
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: Compact Language Selector Grid (4 Cards) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>Elige Entorno de Ejecución</span>
            </h2>
            <span className="text-[11px] text-zinc-500">
              Presiona [1-6] o haz clic para previsualizar
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {ALL_LANGUAGES.map((langId) => {
              const lang = LANGUAGES_DATA[langId];
              const isSelected = selectedLang === langId;

              return (
                <div
                  key={langId}
                  onClick={() => setSelectedLang(langId)}
                  className={`group relative rounded-xl border transition-all duration-200 p-3 sm:p-3 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? `${lang.accentBorder} bg-gradient-to-b ${lang.bannerBg} bg-[#0e111a] shadow-[0_0_20px_${lang.glowColor}] ring-1 ring-white/10 scale-[1.01]`
                      : "border-zinc-800 bg-[#090c12]/90 hover:border-zinc-700 hover:bg-[#0c1017]"
                  }`}
                >
                  <div>
                    {/* Header: Icon + Badge + Key */}
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold ${lang.iconBg}`}
                      >
                        {langId === "cpp"
                          ? "C++"
                          : langId === "python"
                          ? "Py"
                          : langId === "html"
                          ? "Web"
                          : langId === "javascript"
                          ? "JS"
                          : langId === "typescript"
                          ? "TS"
                          : "SH"}
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded border ${
                            isSelected
                              ? "bg-white/10 text-white border-white/20"
                              : "bg-zinc-800 text-zinc-500 border-zinc-700/50"
                          }`}
                        >
                          [{lang.keyNumber}]
                        </span>
                        {isSelected && (
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-ping"
                            style={{ backgroundColor: lang.accentColor }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-1 mb-1">
                      <h3 className="text-sm font-bold text-white tracking-tight">{lang.name}</h3>
                      <span
                        className="text-[9px] px-1 rounded font-semibold"
                        style={{
                          backgroundColor: `${lang.accentColor}15`,
                          color: lang.accentColor,
                        }}
                      >
                        {lang.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-tight mb-2 line-clamp-2">
                      {lang.shortDesc}
                    </p>

                    <div className="text-[10px] text-zinc-500 mb-3 truncate">{lang.version}</div>
                  </div>

                  {/* Launch button */}
                  <Link
                    href={lang.href}
                    className={`w-full py-1.5 px-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? "text-black shadow-sm font-semibold"
                        : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: lang.accentColor,
                          }
                        : {}
                    }
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Abrir {lang.name}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Compact Live Inspector & Runner */}
        <section className="rounded-xl border border-zinc-800/90 bg-[#090c13] overflow-hidden">
          {/* Top Bar of the Inspector */}
          <div className="px-3 py-2 bg-[#06080d] border-b border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </span>
              <span className="text-[11px] text-zinc-400 ml-1">
                Vista previa: <strong className="text-white">{activeLangData.name}</strong> •{" "}
                {activeLangData.engine}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateRun}
                disabled={isSimulating}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] text-zinc-200 transition-all hover:text-white disabled:opacity-50"
              >
                <Zap
                  className={`w-3 h-3 ${
                    isSimulating ? "animate-spin text-neon-green" : "text-neon-cyan"
                  }`}
                />
                <span>{isSimulating ? "Ejecutando..." : "Simular Salida"}</span>
              </button>

              <Link
                href={activeLangData.href}
                className="inline-flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold text-black transition-all"
                style={{ backgroundColor: activeLangData.accentColor }}
              >
                <span>Entrar</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Body: Split Code + Output */}
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-zinc-800/80">
            {/* Code Snippet */}
            <div className="md:col-span-7 p-3 bg-[#07090f]">
              <div className="flex items-center justify-between mb-1.5 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1 text-zinc-400">
                  <Code2 className="w-3 h-3" /> Código de Inicio
                </span>
                <span>
                  {selectedLang === "cpp"
                    ? "main.cc"
                    : selectedLang === "python"
                    ? "main.py"
                    : selectedLang === "html"
                    ? "index.html"
                    : selectedLang === "javascript"
                    ? "index.js"
                    : selectedLang === "typescript"
                    ? "index.ts"
                    : "script.sh"}
                </span>
              </div>
              <pre className="text-[11px] text-zinc-300 leading-snug overflow-x-auto p-2.5 bg-black/60 rounded-md border border-zinc-800/70 max-h-[140px]">
                <code>{activeLangData.sampleCode}</code>
              </pre>
            </div>

            {/* Output & Quick Templates */}
            <div className="md:col-span-5 p-3 bg-[#06080d] flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1 text-[10px]">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <CornerDownLeft
                      className="w-3 h-3"
                      style={{ color: activeLangData.accentColor }}
                    />
                    Salida Estimada
                  </span>
                  <span
                    className="flex items-center gap-0.5 text-[10px]"
                    style={{ color: activeLangData.accentColor }}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" /> 0 ({activeLangData.sampleOutput.execTime})
                  </span>
                </div>

                <div className="bg-black/80 rounded-md p-2.5 border border-zinc-800/80 text-[11px] min-h-[64px] flex flex-col justify-center">
                  {isSimulating ? (
                    <div className="flex items-center justify-center gap-1.5 py-1 text-zinc-500 text-[10px]">
                      <div
                        className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: activeLangData.accentColor }}
                      />
                      <span>Procesando...</span>
                    </div>
                  ) : showSimOutput ? (
                    <div className="space-y-0.5">
                      {activeLangData.sampleOutput.stdout.map((line, idx) => (
                        <p
                          key={idx}
                          className={
                            line.startsWith("»")
                              ? "font-bold"
                              : "text-zinc-300 pl-1 text-[10px]"
                          }
                          style={line.startsWith("»") ? { color: activeLangData.accentColor } : {}}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-center text-[10px]">Esperando...</p>
                  )}
                </div>
              </div>

              {/* Plantillas en chip compacto */}
              <div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-amber-400" />
                  <span>Plantillas Rápidas</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {activeLangData.templates.map((tpl, idx) => (
                    <Link
                      key={idx}
                      href={activeLangData.href}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-[10px] text-zinc-300 transition-colors flex items-center gap-1"
                    >
                      <span className="font-semibold">{tpl.title}</span>
                      <span className="text-zinc-500 text-[9px]">({tpl.desc})</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION: Compact Upcoming Runtimes Strip */}
        <section className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#080a10] border border-zinc-800/60 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 shrink-0 text-[11px]">
            <Binary className="w-3.5 h-3.5" />
            <span>Próximamente:</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto text-[11px]">
            {UPCOMING_LANGUAGES.map((u, i) => (
              <div key={i} className="flex items-center gap-1.5 text-zinc-400 shrink-0">
                <span>{u.icon}</span>
                <span className="font-bold text-zinc-300">{u.name}</span>
                <span className="text-[10px] text-zinc-600">({u.version})</span>
              </div>
            ))}
          </div>

          <span className="text-[10px] text-zinc-600 hidden md:inline shrink-0">
            Micro-VMs Aisladas
          </span>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#06080d] px-4 py-2 text-center text-[10px] text-zinc-600">
        Playground Multi-Lenguaje • C++, Python, HTML/Web, JavaScript, TypeScript, Linux Bash
      </footer>
    </div>
  );
}
