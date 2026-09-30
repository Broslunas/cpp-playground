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

  const hasStderr = Boolean(result?.stderr && result.stderr.trim().length > 0);
  const hasCompilerOut = Boolean(
    result?.compilerOutput && result.compilerOutput.trim().length > 0
  );

  return (
    <div
      className="flex flex-col h-full bg-[#0c0e14] border border-zinc-800 rounded overflow-hidden"
      role="region"
      aria-label="Program Execution Results"
    >
      {/* Header with tabs and actions */}
      <div className="px-2 py-1.5 bg-[#090a0f] border-b border-zinc-800 flex items-center justify-between gap-2">
        {/* Tabs */}
        <div className="flex items-center gap-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "stdout"}
            aria-controls="panel-stdout"
            id="tab-stdout"
            onClick={() => setActiveTab("stdout")}
            className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
              activeTab === "stdout"
                ? "bg-zinc-800 text-neon-green font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output (stdout)</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "stderr"}
            aria-controls="panel-stderr"
            id="tab-stderr"
            onClick={() => setActiveTab("stderr")}
            className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
              activeTab === "stderr"
                ? "bg-zinc-800 text-red-400 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Errors (stderr)</span>
            {hasStderr && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "compiler"}
            aria-controls="panel-compiler"
            id="tab-compiler"
            onClick={() => setActiveTab("compiler")}
            className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
              activeTab === "compiler"
                ? "bg-zinc-800 text-amber-400 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Compiler Logs</span>
            {hasCompilerOut && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        {/* Status & action buttons */}
        <div className="flex items-center gap-2">
          {result && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono mr-1">
              {result.exitCode === 0 ? (
                <span className="flex items-center gap-1 text-neon-green">
                  <CheckCircle2 className="w-3 h-3" /> Exit: 0
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle className="w-3 h-3" /> Exit: {result.exitCode}
                </span>
              )}
              {result.time && (
                <span className="flex items-center gap-1 text-zinc-500">
                  <Clock className="w-3 h-3" /> {result.time}
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleCopy}
            disabled={!result}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30"
            title="Copy current tab output"
            aria-label="Copy output to clipboard"
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
            title="Clear output"
            aria-label="Clear output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output Content Area with Screen Reader Live Announcement */}
      <div
        className="flex-1 p-3 font-mono text-xs overflow-auto bg-[#08090d]"
        aria-live="polite"
        aria-atomic="true"
      >
        {isRunning ? (
          <div className="flex items-center gap-2 text-zinc-500 italic">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
            Compiling and executing on remote server...
          </div>
        ) : !result ? (
          <div className="text-zinc-600 italic">
            Output will appear here after clicking &quot;Run&quot; (or pressing Ctrl+Enter).
          </div>
        ) : (
          <>
            {/* Stdout Tab */}
            {activeTab === "stdout" && (
              <div
                id="panel-stdout"
                role="tabpanel"
                aria-labelledby="tab-stdout"
              >
                {result.stdout ? (
                  <pre className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {result.stdout}
                  </pre>
                ) : (
                  <span className="text-zinc-600 italic">
                    (No output produced to stdout)
                  </span>
                )}
              </div>
            )}

            {/* Stderr Tab */}
            {activeTab === "stderr" && (
              <div
                id="panel-stderr"
                role="tabpanel"
                aria-labelledby="tab-stderr"
              >
                {result.stderr ? (
                  <pre className="text-red-400 whitespace-pre-wrap leading-relaxed">
                    {result.stderr}
                  </pre>
                ) : (
                  <span className="text-zinc-600 italic">
                    (No error output produced to stderr)
                  </span>
                )}
              </div>
            )}

            {/* Compiler Tab */}
            {activeTab === "compiler" && (
              <div
                id="panel-compiler"
                role="tabpanel"
                aria-labelledby="tab-compiler"
              >
                {result.compilerOutput ? (
                  <pre className="text-amber-300/90 whitespace-pre-wrap leading-relaxed">
                    {result.compilerOutput}
                  </pre>
                ) : (
                  <span className="text-zinc-600 italic">
                    (Compilation succeeded with no warnings)
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
