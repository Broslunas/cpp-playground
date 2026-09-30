"use client";

import React, { useState } from "react";
import {
  X,
  SlidersHorizontal,
  Columns,
  Rows,
  Layers,
  ArrowLeftRight,
  ArrowUpDown,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { CustomLayoutConfig, PanelId } from "@/types";

interface CustomLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CustomLayoutConfig;
  onSave: (config: CustomLayoutConfig) => void;
  isHtml?: boolean;
}

export const DEFAULT_CUSTOM_LAYOUT: CustomLayoutConfig = {
  type: "split",
  direction: "row",
  order: ["editor", "stdin", "output"],
  primaryPanel: "editor",
  primaryPosition: "start",
  secondaryDirection: "column",
  secondaryOrder: ["stdin", "output"],
  hiddenPanels: [],
  splitPrimaryPercent: 55,
  splitSecondaryPercent: 35,
  linearPercents: [40, 30, 30],
};

const PANEL_LABELS: Record<PanelId, { name: string; color: string; bg: string }> = {
  editor: { name: "Editor de Código", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40" },
  stdin: { name: "Entrada (stdin)", color: "text-cyan-400", bg: "bg-cyan-500/20 border-cyan-500/40" },
  output: { name: "Salida / Consola", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40" },
};

export function CustomLayoutModal({
  isOpen,
  onClose,
  config,
  onSave,
  isHtml = false,
}: CustomLayoutModalProps) {
  const [draft, setDraft] = useState<CustomLayoutConfig>(config);

  if (!isOpen) return null;

  const togglePanelVisibility = (id: PanelId) => {
    setDraft((prev) => {
      const isHidden = prev.hiddenPanels.includes(id);
      if (isHidden) {
        return {
          ...prev,
          hiddenPanels: prev.hiddenPanels.filter((p) => p !== id),
        };
      }
      // Don't allow hiding all panels
      if (prev.hiddenPanels.length >= 2) return prev;
      return {
        ...prev,
        hiddenPanels: [...prev.hiddenPanels, id],
      };
    });
  };

  const moveLinearPanel = (index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const newOrder = [...prev.order];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev;
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      return { ...prev, order: newOrder };
    });
  };

  const handleApply = () => {
    onSave(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_CUSTOM_LAYOUT);
  };

  // Remaining panels for secondary in split mode
  const allPanels: PanelId[] = ["editor", "stdin", "output"];
  const otherPanels = allPanels.filter((p) => p !== draft.primaryPanel) as [PanelId, PanelId];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-layout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-mono text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-neon-green" />
            <h2 id="custom-layout-title" className="text-sm font-bold text-zinc-100">
              Personalizar Disposición del Playground
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Cerrar ventana de personalización"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 1. Structure Type */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
              Tipo de Estructura
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDraft((p) => ({ ...p, type: "split" }))}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  draft.type === "split"
                    ? "bg-zinc-800/90 border-neon-green text-zinc-100 shadow-sm"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <Layers className="w-4 h-4 text-neon-green shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-200">Dividida (1 Dominante)</div>
                  <div className="text-[10px] text-zinc-500">
                    1 panel principal + 2 paneles secundarios divididos
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDraft((p) => ({ ...p, type: "linear" }))}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  draft.type === "linear"
                    ? "bg-zinc-800/90 border-neon-green text-zinc-100 shadow-sm"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <Columns className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-200">Lineal Continuo</div>
                  <div className="text-[10px] text-zinc-500">
                    Todos los paneles en serie (orden y eje personalizables)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Options for Split */}
          {draft.type === "split" && (
            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                  Panel Principal (Dominante)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["editor", "stdin", "output"] as PanelId[]).map((pid) => (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => {
                        const remaining = allPanels.filter((p) => p !== pid) as [PanelId, PanelId];
                        setDraft((p) => ({
                          ...p,
                          primaryPanel: pid,
                          secondaryOrder: remaining,
                        }));
                      }}
                      className={`py-1.5 px-2 rounded border text-center font-medium transition-colors ${
                        draft.primaryPanel === pid
                          ? "bg-zinc-800 border-neon-green text-neon-green"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {PANEL_LABELS[pid].name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                  Posición del Panel Principal
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "Izquierda", dir: "row" as const, pos: "start" as const },
                    { label: "Derecha", dir: "row" as const, pos: "end" as const },
                    { label: "Arriba", dir: "column" as const, pos: "start" as const },
                    { label: "Abajo", dir: "column" as const, pos: "end" as const },
                  ].map((pos) => {
                    const isSelected =
                      draft.direction === pos.dir && draft.primaryPosition === pos.pos;
                    return (
                      <button
                        key={pos.label}
                        type="button"
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            direction: pos.dir,
                            primaryPosition: pos.pos,
                          }))
                        }
                        className={`py-1.5 px-2 rounded border text-center transition-colors ${
                          isSelected
                            ? "bg-zinc-800 border-neon-green text-neon-green font-semibold"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                  División de los otros 2 paneles
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, secondaryDirection: "column" }))}
                    className={`flex-1 py-1.5 px-2 rounded border text-center transition-colors flex items-center justify-center gap-1.5 ${
                      draft.secondaryDirection === "column"
                        ? "bg-zinc-800 border-neon-green text-neon-green font-semibold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Rows className="w-3.5 h-3.5" />
                    <span>Apilados (Filas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, secondaryDirection: "row" }))}
                    className={`flex-1 py-1.5 px-2 rounded border text-center transition-colors flex items-center justify-center gap-1.5 ${
                      draft.secondaryDirection === "row"
                        ? "bg-zinc-800 border-neon-green text-neon-green font-semibold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Lado a Lado (Columnas)</span>
                  </button>
                </div>
              </div>

              {/* Swap secondary order */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400">
                  Orden secundario:{" "}
                  <strong className="text-zinc-200">
                    {PANEL_LABELS[draft.secondaryOrder?.[0] || otherPanels[0]].name}
                  </strong>{" "}
                  →{" "}
                  <strong className="text-zinc-200">
                    {PANEL_LABELS[draft.secondaryOrder?.[1] || otherPanels[1]].name}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((p) => {
                      const cur = p.secondaryOrder || otherPanels;
                      return {
                        ...p,
                        secondaryOrder: [cur[1], cur[0]],
                      };
                    })
                  }
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Intercambiar</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Options for Linear */}
          {draft.type === "linear" && (
            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                  Orientación de la serie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, direction: "row" }))}
                    className={`py-2 px-3 rounded border text-center transition-colors flex items-center justify-center gap-1.5 ${
                      draft.direction === "row"
                        ? "bg-zinc-800 border-neon-green text-neon-green font-semibold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Todo en Columnas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, direction: "column" }))}
                    className={`py-2 px-3 rounded border text-center transition-colors flex items-center justify-center gap-1.5 ${
                      draft.direction === "column"
                        ? "bg-zinc-800 border-neon-green text-neon-green font-semibold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Rows className="w-3.5 h-3.5" />
                    <span>Todo en Filas (Vertical)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                  Secuencia / Orden de paneles
                </label>
                <div className="space-y-1.5">
                  {draft.order.map((pid, idx) => (
                    <div
                      key={pid}
                      className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800"
                    >
                      <span className="font-semibold text-zinc-200">
                        {idx + 1}. {PANEL_LABELS[pid].name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveLinearPanel(idx, "up")}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 transition-colors"
                          title="Mover antes"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === draft.order.length - 1}
                          onClick={() => moveLinearPanel(idx, "down")}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 transition-colors"
                          title="Mover después"
                        >
                          <ArrowUpDown className="w-3 h-3 rotate-180" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Panel Visibility Toggles */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Visibilidad de Paneles
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["editor", "stdin", "output"] as PanelId[]).map((pid) => {
                const isHidden = draft.hiddenPanels.includes(pid);
                const isHtmlStdin = isHtml && pid === "stdin";
                return (
                  <button
                    key={pid}
                    type="button"
                    disabled={isHtmlStdin}
                    onClick={() => togglePanelVisibility(pid)}
                    className={`p-2 rounded border flex items-center justify-between transition-colors ${
                      isHidden || isHtmlStdin
                        ? "bg-zinc-950 border-zinc-800 text-zinc-500 opacity-60"
                        : "bg-zinc-900/90 border-zinc-700 text-zinc-200"
                    }`}
                  >
                    <div className="truncate pr-1">
                      <span className="block truncate">{PANEL_LABELS[pid].name}</span>
                    </div>
                    {isHidden || isHtmlStdin ? (
                      <EyeOff className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-neon-green shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Miniature Schematic Preview */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Vista Previa Esquemática
            </label>
            <div className="h-28 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 flex overflow-hidden">
              {draft.type === "linear" ? (
                <div
                  className={`w-full h-full flex gap-1 ${
                    draft.direction === "row" ? "flex-row" : "flex-col"
                  }`}
                >
                  {draft.order
                    .filter((p) => !draft.hiddenPanels.includes(p))
                    .map((pid) => (
                      <div
                        key={pid}
                        className={`flex-1 rounded border flex items-center justify-center font-bold text-[10px] ${PANEL_LABELS[pid].bg} ${PANEL_LABELS[pid].color}`}
                      >
                        {PANEL_LABELS[pid].name.split(" ")[0]}
                      </div>
                    ))}
                </div>
              ) : (
                /* Split preview */
                <div
                  className={`w-full h-full flex gap-1 ${
                    draft.direction === "row" ? "flex-row" : "flex-col"
                  }`}
                >
                  {draft.primaryPosition === "start" && (
                    <div
                      className={`flex-[1.5] rounded border flex items-center justify-center font-bold text-[10px] ${
                        PANEL_LABELS[draft.primaryPanel].bg
                      } ${PANEL_LABELS[draft.primaryPanel].color}`}
                    >
                      {PANEL_LABELS[draft.primaryPanel].name.split(" ")[0]} (Principal)
                    </div>
                  )}

                  <div
                    className={`flex-1 flex gap-1 ${
                      draft.secondaryDirection === "row" ? "flex-row" : "flex-col"
                    }`}
                  >
                    {(draft.secondaryOrder || otherPanels)
                      .filter((p) => !draft.hiddenPanels.includes(p))
                      .map((pid) => (
                        <div
                          key={pid}
                          className={`flex-1 rounded border flex items-center justify-center font-bold text-[9px] ${PANEL_LABELS[pid].bg} ${PANEL_LABELS[pid].color}`}
                        >
                          {PANEL_LABELS[pid].name.split(" ")[0]}
                        </div>
                      ))}
                  </div>

                  {draft.primaryPosition === "end" && (
                    <div
                      className={`flex-[1.5] rounded border flex items-center justify-center font-bold text-[10px] ${
                        PANEL_LABELS[draft.primaryPanel].bg
                      } ${PANEL_LABELS[draft.primaryPanel].color}`}
                    >
                      {PANEL_LABELS[draft.primaryPanel].name.split(" ")[0]} (Principal)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Por Defecto</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3.5 py-1.5 rounded bg-neon-green text-black font-semibold hover:bg-neon-green/90 transition-colors flex items-center gap-1.5 text-xs shadow-lg shadow-neon-green/10"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
