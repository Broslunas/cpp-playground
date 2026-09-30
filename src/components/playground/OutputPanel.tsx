"use client";

import React, { useState } from "react";
import {
  Terminal,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { CompileResponse } from "@/types";

interface OutputPanelProps {
  result: CompileResponse | null;
  isRunning: boolean;
  onClear: () => void;
}

type TabType = "stdout" | "stderr" | "compiler";

export function OutputPanel({ result, isRunning, onClear }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("stdout");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Automatically switch tab if there is an error but no stdout
  React.useEffect(() => {
    if (result) {
      if (result.stderr && !result.stdout) {
        setActiveTab("stderr");
      } else if (result.compilerOutput && result.exitCode !== 0 && !result.stdout) {
        setActiveTab("compiler");
      } else {
        setActiveTab("stdout");
      }
    }
  }, [result]);

  const handleCopy = () => {
    let textToCopy = "";
    if (activeTab === "stdout") textToCopy = result?.stdout || "";
    if (activeTab === "stderr") textToCopy = result?.stderr || "";
    if (activeTab === "compiler") textToCopy = result?.compilerOutput || "";

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filterText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const lines = text.split("\n");
    const filtered = lines.filter((line) =>
      line.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.length > 0
      ? filtered.join("\n")
      : `(No se encontraron líneas que coincidan con "${searchQuery}")`;
  };

  const hasStderr = Boolean(result?.stderr && result.stderr.trim().length > 0);
  const hasCompilerOut = Boolean(
    result?.compilerOutput && result.compilerOutput.trim().length > 0
  );

  return (
    <div
      className="flex flex-col h-full bg-[#0c0e14] border border-zinc-800 rounded overflow-hidden"
      role="region"
      aria-label="Resultados de Ejecución"
    >
      {/* Header with tabs and actions */}
      <div className="px-2 py-1.5 bg-[#090a0f] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Tabs */}
        <div className="flex items-center gap-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "stdout"}
            aria-controls="panel-stdout"
            id="tab-stdout"
            onClick={() => setActiveTab("stdout")}
            className={`px-2 sm:px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
              activeTab === "stdout"
                ? "bg-zinc-800 text-neon-green font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "stderr"}
            aria-controls="panel-stderr"
            id="tab-stderr"
            onClick={() => setActiveTab("stderr")}
            className={`px-2 sm:px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
              activeTab === "stderr"
                ? "bg-zinc-800 text-red-400 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Errores</span>
            {hasStderr && <span className="w-2 h-2 rounded-full bg-red-500" />}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "compiler"}
            aria-controls="panel-compiler"
            id="tab-compiler"
            onClick={() => setActiveTab("compiler")}
            className={`px-2 sm:px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
              activeTab === "compiler"
                ? "bg-zinc-800 text-amber-400 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compilador</span>
            {hasCompilerOut && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Filter */}
          <div className="relative hidden xl:block">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar..."
              className="w-24 focus:w-36 transition-all bg-zinc-900 border border-zinc-800 rounded pl-6 pr-2 py-0.5 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-neon-green"
            />
          </div>

          {result && (
            <div className="flex items-center gap-2 text-[11px] font-mono mr-1">
              {result.exitCode === 0 ? (
                <span className="flex items-center gap-1 text-neon-green bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  <CheckCircle2 className="w-3 h-3" /> Exit: 0
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800/40">
                  <XCircle className="w-3 h-3" /> Exit: {result.exitCode}
                </span>
              )}
              {result.executionTimeMs !== undefined ? (
                <span className="flex items-center gap-1 text-zinc-400">
                  <Clock className="w-3 h-3 text-cyan-400" /> {result.executionTimeMs}ms
                </span>
              ) : result.time ? (
                <span className="flex items-center gap-1 text-zinc-500">
                  <Clock className="w-3 h-3" /> {result.time}
                </span>
              ) : null}
            </div>
          )}

          <button
            onClick={handleCopy}
            disabled={!result}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30"
            title="Copiar texto de esta pestaña"
            aria-label="Copiar salida al portapapeles"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-neon-green" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onClear}
            disabled={!result}
            className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-30"
            title="Limpiar salida"
            aria-label="Limpiar salida"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output Content Area */}
      <div
        className="flex-1 min-h-0 p-3 font-mono text-xs overflow-auto bg-[#08090d]"
        aria-live="polite"
        aria-atomic="true"
      >
        {isRunning ? (
          <div className="flex items-center gap-2 text-zinc-500 italic">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
            Compilando y ejecutando programa C++...
          </div>
        ) : !result ? (
          <div className="text-zinc-600 italic">
            La salida del programa se mostrará aquí tras hacer clic en &quot;Run&quot; o presionar Ctrl+Enter.
          </div>
        ) : (
          <>
            {/* Stdout Tab */}
            {activeTab === "stdout" && (
              <div id="panel-stdout" role="tabpanel" aria-labelledby="tab-stdout">
                {result.stdout ? (
                  <pre className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {filterText(result.stdout)}
                  </pre>
                ) : (
                  <span className="text-zinc-600 italic">(Sin salida en stdout)</span>
                )}
              </div>
            )}

            {/* Stderr Tab */}
            {activeTab === "stderr" && (
              <div id="panel-stderr" role="tabpanel" aria-labelledby="tab-stderr">
                {result.stderr ? (
                  <pre className="text-red-400 whitespace-pre-wrap leading-relaxed">
                    {filterText(result.stderr)}
                  </pre>
                ) : (
                  <span className="text-zinc-600 italic">(Sin errores en stderr)</span>
                )}
              </div>
            )}

            {/* Compiler Tab */}
            {activeTab === "compiler" && (
              <div id="panel-compiler" role="tabpanel" aria-labelledby="tab-compiler">
                {result.compilerOutput ? (
                  <pre className="text-amber-300/90 whitespace-pre-wrap leading-relaxed">
                    {filterText(result.compilerOutput)}
                  </pre>
                ) : (
                  <span className="text-zinc-600 italic">
                    (Compilación exitosa sin advertencias ni logs)
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
