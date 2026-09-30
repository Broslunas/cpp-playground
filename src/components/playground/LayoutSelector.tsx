"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Layout,
  Columns2,
  Columns3,
  Rows3,
  SlidersHorizontal,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { PlaygroundLayout } from "@/types";

interface LayoutSelectorProps {
  layout: PlaygroundLayout;
  onLayoutChange: (layout: PlaygroundLayout) => void;
  showStdin: boolean;
  onToggleStdin: () => void;
  onResetSizes: () => void;
  onOpenCustomModal?: () => void;
  isHtml?: boolean;
}

const LAYOUT_OPTIONS: {
  id: PlaygroundLayout;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "standard",
    title: "Estándar",
    description: "Editor arriba, entrada y salida abajo",
    icon: Layout,
  },
  {
    id: "two-column",
    title: "2 Columnas",
    description: "Editor a la izquierda, salida a la derecha",
    icon: Columns2,
  },
  {
    id: "columns",
    title: "3 Columnas",
    description: "Editor, entrada y salida en paralelo",
    icon: Columns3,
  },
  {
    id: "vertical",
    title: "Vertical",
    description: "Todos los paneles apilados en filas",
    icon: Rows3,
  },
  {
    id: "custom",
    title: "Personalizado",
    description: "Disposición libre (ejes, orden y dominante)",
    icon: SlidersHorizontal,
  },
];

export function LayoutSelector({
  layout,
  onLayoutChange,
  showStdin,
  onToggleStdin,
  onResetSizes,
  onOpenCustomModal,
  isHtml = false,
}: LayoutSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const CurrentIcon =
    LAYOUT_OPTIONS.find((opt) => opt.id === layout)?.icon || Layout;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
          isOpen
            ? "bg-zinc-800 text-neon-green"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
        }`}
        title="Cambiar diseño del Playground"
        aria-label="Selector de diseño del workspace"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-1.5 w-64 rounded-lg bg-zinc-900 border border-zinc-700/80 shadow-2xl p-2 z-50 text-xs font-mono text-zinc-300 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Estructura del Playground
          </div>

          <div className="space-y-1 mt-1">
            {LAYOUT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = layout === opt.id;
              return (
                <button
                  key={opt.id}
                  role="menuitem"
                  onClick={() => {
                    onLayoutChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors ${
                    isSelected
                      ? "bg-zinc-800/90 text-neon-green border border-neon-green/30"
                      : "hover:bg-zinc-800/60 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-zinc-400" />
                    <div>
                      <div className="font-semibold leading-tight">
                        {opt.title}
                      </div>
                      <div className="text-[10px] text-zinc-500 leading-tight">
                        {opt.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-neon-green shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="my-2 border-t border-zinc-800" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onLayoutChange("custom");
              onOpenCustomModal?.();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-800/80 text-neon-green hover:text-white transition-colors text-left border border-neon-green/30 bg-neon-green/5"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neon-green" />
              <span className="font-semibold">Configurar Personalizado...</span>
            </div>
          </button>

          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-2">
            Personalizar Paneles
          </div>

          {!isHtml ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleStdin();
              }}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-800/60 text-zinc-300 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                {showStdin ? (
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span>Panel Entrada (stdin)</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  showStdin
                    ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {showStdin ? "Visible" : "Oculto"}
              </span>
            </button>
          ) : (
            <div className="px-2 py-1.5 text-[11px] text-zinc-500 italic">
              Vista previa web activa (stdin no requerido)
            </div>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onResetSizes();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-colors text-left mt-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer proporciones</span>
          </button>
        </div>
      )}
    </div>
  );
}
