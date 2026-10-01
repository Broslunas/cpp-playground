"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Eye,
  RotateCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { CompileResponse, SupportedLanguage } from "@/types";
import { ExerciseSolutionPanel } from "@/components/exercises/ExerciseSolutionPanel";

interface OutputPanelProps {
  result: CompileResponse | null;
  isRunning: boolean;
  onClear: () => void;
  language?: SupportedLanguage;
  code?: string;
  onMaximize?: () => void;
  isMaximized?: boolean;
  solution?: string;
  onLoadSolution?: () => void;
}

type TabType = "preview" | "stdout" | "stderr" | "compiler" | "solution";

export function OutputPanel({
  result,
  isRunning,
  onClear,
  language = "cpp",
  code = "",
  onMaximize,
  isMaximized = false,
  solution,
  onLoadSolution,
}: OutputPanelProps) {
  const isHtml = language === "html";
  const [activeTab, setActiveTab] = useState<TabType>(() => (isHtml ? "preview" : "stdout"));
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: "log" | "error"; text: string; time: string }>>([]);
  const [iframeKey, setIframeKey] = useState(0);

  // Switch initial tab when language changes
  useEffect(() => {
    if (language === "html") {
      setActiveTab("preview");
    } else {
      setActiveTab("stdout");
    }
    setConsoleLogs([]);
  }, [language]);

  // Listen for console logs emitted from the HTML iframe sandbox
  useEffect(() => {
    if (!isHtml) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data && (e.data.type === "html-console-log" || e.data.type === "html-console-error")) {
        setConsoleLogs((prev) => [
          ...prev,
          {
            type: e.data.type === "html-console-error" ? "error" : "log",
            text: e.data.text,
            time: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isHtml]);

  // Automatically switch tab if error occurs
  useEffect(() => {
    if (result && !isHtml) {
      if (result.stderr && !result.stdout) {
        setActiveTab("stderr");
      } else if (result.compilerOutput && result.exitCode !== 0 && !result.stdout) {
        setActiveTab("compiler");
      } else {
        setActiveTab("stdout");
      }
    }
  }, [result, isHtml]);

  // HTML source code with console hook injection
  const previewDoc = useMemo(() => {
    if (!isHtml || !code) return "";

    const injection = `
<script>
  (function() {
    const _log = console.log;
    const _error = console.error;
    const _warn = console.warn;
    console.log = function(...args) {
      try {
        window.parent.postMessage({
          type: 'html-console-log',
          text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        }, '*');
      } catch(e) {}
      _log.apply(console, args);
    };
    console.error = function(...args) {
      try {
        window.parent.postMessage({
          type: 'html-console-error',
          text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        }, '*');
      } catch(e) {}
      _error.apply(console, args);
    };
    window.onerror = function(msg, url, line) {
      try {
        window.parent.postMessage({
          type: 'html-console-error',
          text: 'Error [' + line + ']: ' + msg
        }, '*');
      } catch(e) {}
    };
  })();
</script>
`;

    if (code.includes("<head>")) {
      return code.replace("<head>", `<head>${injection}`);
    } else if (code.includes("<html>")) {
      return code.replace("<html>", `<html><head>${injection}</head>`);
    }
    return `${injection}${code}`;
  }, [isHtml, code]);

  const handleCopy = () => {
    let textToCopy = "";
    if (activeTab === "stdout") {
      if (isHtml) {
        textToCopy = consoleLogs.map((l) => `[${l.time}] ${l.text}`).join("\n");
      } else {
        textToCopy = result?.stdout || "";
      }
    }
    if (activeTab === "stderr") textToCopy = result?.stderr || "";
    if (activeTab === "compiler") textToCopy = result?.compilerOutput || "";

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClearAll = () => {
    setConsoleLogs([]);
    onClear();
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

  const hasStderr = Boolean(
    (result?.stderr && result.stderr.trim().length > 0) ||
      consoleLogs.some((l) => l.type === "error")
  );
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
          {/* HTML Live Preview Tab */}
          {isHtml && (
            <button
              role="tab"
              aria-selected={activeTab === "preview"}
              aria-controls="panel-preview"
              id="tab-preview"
              onClick={() => setActiveTab("preview")}
              className={`px-2 sm:px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                activeTab === "preview"
                  ? "bg-zinc-800 text-neon-green font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Vista Previa</span>
            </button>
          )}

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
            <span>{isHtml ? "Consola (Logs)" : "Output"}</span>
            {isHtml && consoleLogs.length > 0 && (
              <span className="px-1.5 py-0.2 bg-zinc-700 text-zinc-200 rounded-full text-[10px]">
                {consoleLogs.length}
              </span>
            )}
          </button>

          {!isHtml && (
            <>
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

              {solution !== undefined && (
                <button
                  role="tab"
                  aria-selected={activeTab === "solution"}
                  aria-controls="panel-solution"
                  id="tab-solution"
                  onClick={() => setActiveTab("solution")}
                  className={`px-2 sm:px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                    activeTab === "solution"
                      ? "bg-zinc-800 text-cyan-400 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Solución</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-1.5">
          {/* Reload Preview button for HTML */}
          {isHtml && (
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="p-1 rounded text-zinc-400 hover:text-neon-green hover:bg-zinc-800 transition-colors"
              title="Recargar vista previa"
              aria-label="Recargar vista previa"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

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
            disabled={!result && consoleLogs.length === 0}
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
            onClick={handleClearAll}
            disabled={!result && consoleLogs.length === 0}
            className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-30"
            title="Limpiar salida"
            aria-label="Limpiar salida"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

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

      {/* Output Content Area */}
      <div
        className="flex-1 min-h-0 overflow-hidden bg-[#08090d] relative"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Live Preview Tab for HTML */}
        {isHtml && activeTab === "preview" && (
          <div className="w-full h-full p-2 bg-[#090a0f]">
            <iframe
              key={iframeKey}
              srcDoc={previewDoc}
              title="HTML/CSS/JS Live Preview"
              sandbox="allow-scripts allow-modals"
              className="w-full h-full rounded border border-zinc-800 bg-[#0f111a]"
            />
          </div>
        )}

        {/* Stdout / Console Tab */}
        {activeTab === "stdout" && (
          <div
            id="panel-stdout"
            role="tabpanel"
            aria-labelledby="tab-stdout"
            className="p-3 font-mono text-xs overflow-auto h-full"
          >
            {isHtml ? (
              consoleLogs.length === 0 ? (
                <div className="text-zinc-600 italic">
                  Los registros de console.log() y console.error() se mostrarán aquí en tiempo real al interactuar con la página.
                </div>
              ) : (
                <div className="space-y-1">
                  {consoleLogs.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 py-0.5 border-b border-zinc-900/60 ${
                        item.type === "error" ? "text-red-400" : "text-zinc-300"
                      }`}
                    >
                      <span className="text-[10px] text-zinc-600 select-none">
                        [{item.time}]
                      </span>
                      <span className="font-semibold select-none">
                        {item.type === "error" ? "✕" : "›"}
                      </span>
                      <pre className="whitespace-pre-wrap font-mono flex-1">
                        {filterText(item.text)}
                      </pre>
                    </div>
                  ))}
                </div>
              )
            ) : isRunning ? (
              <div className="flex items-center gap-2 text-zinc-500 italic">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
                Ejecutando programa...
              </div>
            ) : !result ? (
              <div className="text-zinc-600 italic">
                La salida del programa se mostrará aquí tras hacer clic en &quot;Run&quot; o presionar Ctrl+Enter.
              </div>
            ) : (
              <div>
                {result.stdout ? (
                  <pre className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {filterText(result.stdout)}
                  </pre>
                ) : (
                  <span className="text-zinc-600 italic">(Sin salida en stdout)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stderr Tab */}
        {!isHtml && activeTab === "stderr" && (
          <div
            id="panel-stderr"
            role="tabpanel"
            aria-labelledby="tab-stderr"
            className="p-3 font-mono text-xs overflow-auto h-full"
          >
            {result?.stderr ? (
              <pre className="text-red-400 whitespace-pre-wrap leading-relaxed">
                {filterText(result.stderr)}
              </pre>
            ) : (
              <span className="text-zinc-600 italic">(Sin errores en stderr)</span>
            )}
          </div>
        )}

        {/* Compiler Tab */}
        {!isHtml && activeTab === "compiler" && (
          <div
            id="panel-compiler"
            role="tabpanel"
            aria-labelledby="tab-compiler"
            className="p-3 font-mono text-xs overflow-auto h-full"
          >
            {result?.compilerOutput ? (
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

        {/* Solution Tab */}
        {!isHtml && activeTab === "solution" && solution !== undefined && (
          <div
            id="panel-solution"
            role="tabpanel"
            aria-labelledby="tab-solution"
            className="h-full"
          >
            <ExerciseSolutionPanel solution={solution} onLoad={onLoadSolution || (() => {})} />
          </div>
        )}
      </div>
    </div>
  );
}
