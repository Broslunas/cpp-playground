"use client";

import React from "react";
import { Terminal, Maximize2, Minimize2 } from "lucide-react";

interface StdinPanelProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onMaximize?: () => void;
  isMaximized?: boolean;
  onSwitchToInteractive?: () => void;
}

export function StdinPanel({
  value,
  onChange,
  disabled = false,
  onMaximize,
  isMaximized = false,
  onSwitchToInteractive,
}: StdinPanelProps) {
  return (
    <div className="flex flex-col h-full bg-[#0c0e14] border border-zinc-800 rounded overflow-hidden">
      <div className="px-3 py-2 bg-[#090a0f] border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
          <Terminal className="w-3.5 h-3.5 text-neon-cyan" />
          <span className="font-semibold text-zinc-200">STANDARD INPUT (stdin)</span>
        </div>
        <div className="flex items-center gap-2">
        
          {onMaximize && (
            <button
              type="button"
              onClick={onMaximize}
              className="p-1 rounded text-zinc-400 hover:text-neon-green hover:bg-zinc-800 transition-colors"
              title={isMaximized ? "Restaurar panel (Esc)" : "Maximizar panel"}
              aria-label={isMaximized ? "Restaurar panel" : "Maximizar panel"}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5 text-neon-green" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2">
        <label htmlFor="stdin-input" className="sr-only">
          Program Standard Input (stdin)
        </label>
        <textarea
          id="stdin-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter input for your program here (e.g. values read by std::cin)..."
          className="w-full h-full p-2 bg-[#090a0f] text-zinc-200 font-mono text-xs resize-none rounded border border-zinc-800/80 focus:outline-none focus:border-neon-cyan/50 placeholder:text-zinc-600 leading-relaxed overflow-auto"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
