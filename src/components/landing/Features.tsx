import React from "react";
import {
  Code2,
  Terminal,
  Save,
  Eye,
  Sliders,
  Gauge,
  Sparkles,
  LayoutGrid,
  Shield,
  Share2,
} from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "Editor Profesional CodeMirror 6",
    description:
      "Resaltado sintáctico de alto contraste, indentación inteligente, números de línea, zen mode y atajos de teclado completos.",
    accent: "green",
  },
  {
    icon: Terminal,
    title: "Soporte Completo para I/O y Stdin",
    description:
      "Envía entradas por stdin a tus programas (std::cin, input(), readline) y visualiza stdout y stderr con códigos de salida y tiempos exactos.",
    accent: "cyan",
  },
  {
    icon: Sliders,
    title: "GCC 14, Clang & Sanitizers",
    description:
      "Compiladores modernos con soporte para C++11 hasta C++23, niveles de optimización (-O0 a -O3) y Address/Undefined Sanitizers (ASan/UBSan).",
    accent: "green",
  },
  {
    icon: LayoutGrid,
    title: "Layouts Flexibles y Personalizables",
    description:
      "Elige entre disposiciones horizontales, verticales, modo Zen libre de distracciones o diseña tu propia cuadrícula de trabajo.",
    accent: "cyan",
  },
  {
    icon: Save,
    title: "Persistencia 100% Local en Navegador",
    description:
      "Tus proyectos y archivos se guardan automáticamente en LocalStorage sin necesidad de registros ni recopilación de datos.",
    accent: "green",
  },
  {
    icon: Share2,
    title: "Compartir y Exportar al Instante",
    description:
      "Genera enlaces directos con tu código embebido o descarga tus fuentes en archivos .cpp, .py, .ts o proyectos listos para compilar.",
    accent: "cyan",
  },
  {
    icon: Eye,
    title: "Accesibilidad Total (WCAG 2.1 AA)",
    description:
      "Navegación completa por teclado, lectores de pantalla con regiones aria-live, contrastes verificados y soporte para SkipLink.",
    accent: "green",
  },
  {
    icon: Gauge,
    title: "Protección Robusta con Rate Limiting",
    description:
      "Aislamiento en sandbox seguro en la nube con control de concurrencia y límites por IP para garantizar disponibilidad constante.",
    accent: "cyan",
  },
];

export function Features() {
  return (
    <section id="capacidades" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <h2 className="text-xs font-mono uppercase tracking-widest text-neon-green mb-3">
          Potencia y Flexibilidad
        </h2>
        <p className="text-3xl sm:text-4xl font-bold font-mono text-white">
          Todo lo que necesitas en ejecuta.tech
        </p>
        <p className="text-zinc-400 text-sm max-w-2xl mx-auto mt-3 font-sans">
          Diseñado para desarrolladores, estudiantes y creadores que buscan velocidad sin fricción.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          const isGreen = feature.accent === "green";
          return (
            <div
              key={idx}
              className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 transition-all hover:-translate-y-1 group flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 border ${
                    isGreen
                      ? "border-neon-green/30 bg-neon-green/10 text-neon-green group-hover:shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                      : "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan group-hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                  } transition-all`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold font-mono text-zinc-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
