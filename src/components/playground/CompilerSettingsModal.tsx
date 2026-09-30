"use client";

import React from "react";
import { X, Sliders, ShieldAlert, Zap, AlertTriangle, Cpu } from "lucide-react";
import { CompilerSettings } from "@/types";

interface CompilerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompilerSettings;
  onChange: (settings: CompilerSettings) => void;
}

export const DEFAULT_COMPILER_SETTINGS: CompilerSettings = {
  optimization: "-O2",
  sanitizers: [],
  warnings: ["Wall"],
  customFlags: "",
};

const OPTIMIZATION_LEVELS = [
  { id: "-O0", label: "-O0 (Sin optimizar, ideal debug)" },
  { id: "-O1", label: "-O1 (Optimización básica)" },
  { id: "-O2", label: "-O2 (Recomendado estándar)", recommended: true },
  { id: "-O3", label: "-O3 (Máximo rendimiento/vectorización)" },
  { id: "-Os", label: "-Os (Optimizar para tamaño mínimo)" },
  { id: "-Ofast", label: "-Ofast (Agresivo, no estricto IEEE-754)" },
];

const SANITIZERS = [
  { id: "undefined", label: "UndefinedBehaviorSanitizer (UBSan)", desc: "Detecta overflow entero, punteros nulos, alineación" },
  { id: "leak", label: "LeakSanitizer (LSan)", desc: "Detecta fugas de memoria al finalizar ejecución" },
  { id: "address", label: "AddressSanitizer (ASan)", desc: "Detecta accesos fuera de rango (puede exceder ulimit en Wandbox)" },
];

const WARNING_PRESETS = [
  { id: "Wall", label: "-Wall (Advertencias habituales)" },
  { id: "Wextra", label: "-Wextra (Advertencias adicionales)" },
  { id: "Wpedantic", label: "-Wpedantic (Estricto estándar ISO)" },
  { id: "Werror", label: "-Werror (Tratar warnings como errores)" },
];

export function CompilerSettingsModal({
  isOpen,
  onClose,
  settings,
  onChange,
}: CompilerSettingsModalProps) {
  if (!isOpen) return null;

  const toggleSanitizer = (id: string) => {
    const active = settings.sanitizers.includes(id);
    const updated = active
      ? settings.sanitizers.filter((s) => s !== id)
      : [...settings.sanitizers, id];
    onChange({ ...settings, sanitizers: updated });
  };

  const toggleWarning = (id: string) => {
    const active = settings.warnings.includes(id);
    const updated = active
      ? settings.warnings.filter((w) => w !== id)
      : [...settings.warnings, id];
    onChange({ ...settings, warnings: updated });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compiler-settings-title"
    >
      <div className="bg-[#0e111a] border border-zinc-800 rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-[#090a0f] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neon-green">
            <Sliders className="w-4 h-4" />
            <h2 id="compiler-settings-title" className="font-semibold text-sm text-zinc-100">
              Opciones Avanzadas del Compilador
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Cerrar opciones"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-5 text-zinc-300">
          {/* Optimization Level */}
          <div>
            <label className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Nivel de Optimización
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {OPTIMIZATION_LEVELS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...settings, optimization: opt.id })}
                  className={`p-2 rounded text-left border transition-all ${
                    settings.optimization === opt.id
                      ? "bg-zinc-800/90 border-neon-green text-neon-green shadow-[0_0_10px_rgba(0,255,136,0.15)]"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-semibold">{opt.id}</div>
                  <div className="text-[10px] text-zinc-500">{opt.label.split("(")[1]?.replace(")", "") || ""}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sanitizers */}
          <div>
            <label className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Sanitizers de Ejecución
            </label>
            <div className="space-y-1.5">
              {SANITIZERS.map((s) => {
                const checked = settings.sanitizers.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-start gap-2.5 p-2 rounded border cursor-pointer select-none transition-all ${
                      checked
                        ? "bg-red-950/20 border-red-500/60 text-zinc-100"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSanitizer(s.id)}
                      className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-xs text-zinc-200">{s.label}</div>
                      <div className="text-[10px] text-zinc-500">{s.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Warnings */}
          <div>
            <label className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Advertencias y Diagnósticos
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {WARNING_PRESETS.map((w) => {
                const checked = settings.warnings.includes(w.id);
                return (
                  <label
                    key={w.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition-all ${
                      checked
                        ? "bg-zinc-800/90 border-amber-400/60 text-amber-300"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWarning(w.id)}
                      className="rounded border-zinc-700 bg-zinc-900 text-amber-400 focus:ring-0"
                    />
                    <span className="text-[11px] font-medium">{w.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom flags */}
          <div>
            <label
              htmlFor="custom-flags-input"
              className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-1"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Flags Adicionales Personalizados
            </label>
            <p className="text-[10px] text-zinc-500 mb-1.5">
              Separados por espacio (ejemplo: <code className="text-zinc-300">-fno-exceptions -march=native</code>)
            </p>
            <input
              id="custom-flags-input"
              type="text"
              value={settings.customFlags}
              onChange={(e) => onChange({ ...settings, customFlags: e.target.value })}
              placeholder="-fconcepts -fcoroutines"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-neon-green"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#090a0f] border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_COMPILER_SETTINGS)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-[11px]"
          >
            Restaurar valores por defecto
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-neon-green text-black font-semibold hover:bg-[#00e67a] transition-colors"
          >
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
