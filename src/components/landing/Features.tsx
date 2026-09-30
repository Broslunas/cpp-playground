import React from "react";
import {
  Code2,
  Terminal,
  Save,
  Eye,
  Sliders,
  Gauge,
  Lock,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "Editor Moderno con Resaltado",
    description:
      "Basado en CodeMirror 6 con resaltado sintáctico completo para C++, números de línea, autocompletado y soporte para atajos de teclado.",
    accent: "green",
  },
  {
    icon: Terminal,
    title: "Soporte Completo para I/O",
    description:
      "Envía datos por stdin a tus programas con std::cin y visualiza stdout y stderr separados con colores semánticos y códigos de retorno.",
    accent: "cyan",
  },
  {
    icon: Save,
    title: "Persistencia Local",
    description:
      "Todos tus proyectos y snippets se guardan automáticamente en tu navegador usando localStorage. Sin necesidad de registrarte.",
    accent: "green",
  },
  {
    icon: Sliders,
    title: "Múltiples Compiladores",
    description:
      "Elige entre las versiones más recientes de GCC y Clang, con soporte desde C++11 hasta C++23 y opciones de optimización -O2.",
    accent: "cyan",
  },
  {
    icon: Eye,
    title: "100% Accesible (WCAG 2.1 AA)",
    description:
      "Diseñado con soporte completo para navegación con teclado, lectores de pantalla (aria-live), enlaces de salto y contrastes óptimos.",
    accent: "green",
  },
  {
    icon: Gauge,
    title: "Protección con Rate Limits",
    description:
      "Sistema de limitación de tasa por IP en el servidor que protege contra sobrecargas y garantiza disponibilidad para todos los usuarios.",
    accent: "cyan",
  },
];

export function Features() {
  return (
    <section id="caracteristicas" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <h2 className="text-xs font-mono uppercase tracking-widest text-neon-green mb-3">
          Capacidades del Sistema
        </h2>
        <p className="text-3xl sm:text-4xl font-bold font-mono text-white">
          Todo lo que necesitas para programar en C++
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          const isGreen = feature.accent === "green";
          return (
            <div
              key={idx}
              className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 transition-all hover:-translate-y-1 group"
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 border ${
                  isGreen
                    ? "border-neon-green/30 bg-neon-green/10 text-neon-green group-hover:shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                    : "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan group-hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                } transition-all`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold font-mono text-zinc-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
