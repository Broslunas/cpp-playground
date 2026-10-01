"use client";

import { Copy, FileCode } from "lucide-react";

interface ExerciseSolutionPanelProps {
  solution: string;
  onLoad: () => void;
}

export function ExerciseSolutionPanel({ solution, onLoad }: ExerciseSolutionPanelProps) {
  return (
    <div className="h-full flex flex-col font-mono">
      <div className="p-3 border-b border-zinc-800 bg-[#090a0f] flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
          <FileCode className="w-3.5 h-3.5 text-neon-green" />
          <span>Solución de referencia</span>
        </div>
        <button
          type="button"
          onClick={onLoad}
          className="px-2.5 py-1 rounded bg-neon-green text-black text-xs font-bold flex items-center gap-1 hover:bg-[#00e67a]"
        >
          <Copy className="w-3 h-3" /> Llevar al editor
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-3 text-[11px] text-zinc-300 whitespace-pre leading-relaxed">{solution}</pre>
    </div>
  );
}
