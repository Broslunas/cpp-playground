"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["Ctrl", "Enter"], mac: ["⌘", "Enter"], desc: "Compilar y ejecutar el programa" },
  { keys: ["Ctrl", "S"], mac: ["⌘", "S"], desc: "Guardar proyecto en almacenamiento local" },
  { keys: ["Ctrl", "Shift", "F"], mac: ["⌘", "Shift", "F"], desc: "Auto-formatear código C++" },
  { keys: ["Ctrl", "K"], mac: ["⌘", "K"], desc: "Abrir biblioteca de plantillas" },
  { keys: ["Ctrl", "B"], mac: ["⌘", "B"], desc: "Abrir opciones de compilador y sanitizers" },
  { keys: ["Esc"], mac: ["Esc"], desc: "Cerrar modales y paneles emergentes" },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="bg-[#0e111a] border border-zinc-800 rounded-lg max-w-md w-full shadow-2xl overflow-hidden font-mono text-xs">
        <div className="px-4 py-3 bg-[#090a0f] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neon-green">
            <Keyboard className="w-4 h-4" />
            <h2 id="shortcuts-title" className="font-semibold text-sm text-zinc-100">
              Atajos de Teclado
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-800/80"
            >
              <span className="text-zinc-300">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, kidx) => (
                  <kbd
                    key={kidx}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[11px] font-sans font-semibold"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 bg-[#090a0f] border-t border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
