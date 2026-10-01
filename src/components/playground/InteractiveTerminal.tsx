"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Terminal,
  Play,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Split,
  CornerDownLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { SupportedLanguage, CompilerSettings, CompileResponse } from "@/types";

export interface TerminalEntry {
  id: string;
  type: "system" | "stdout" | "stderr" | "input" | "info";
  text: string;
}

interface InteractiveTerminalProps {
  code: string;
  language: SupportedLanguage;
  compiler?: string;
  standard?: string;
  compilerSettings?: CompilerSettings;
  onSwitchToSplit?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  initialStdin?: string;
  onStdinChange?: (newStdin: string) => void;
  runTrigger?: number;
  onRunningChange?: (running: boolean) => void;
}

export function InteractiveTerminal({
  code,
  language,
  compiler,
  standard,
  compilerSettings,
  onSwitchToSplit,
  onMaximize,
  isMaximized = false,
  initialStdin = "",
  onStdinChange,
  runTrigger,
  onRunningChange,
}: InteractiveTerminalProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [interactiveInputs, setInteractiveInputs] = useState<string[]>(() => {
    return initialStdin
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  });
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastStdoutRef = useRef<string>("");

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [entries, isRunning, scrollToBottom]);

  // Focus input automatically
  const focusInput = () => {
    inputRef.current?.focus();
  };

  const executeWithInputs = useCallback(
    async (inputs: string[], isInitial = false) => {
      if (isRunning) return;
      setIsRunning(true);

      const stdinString = inputs.length > 0 ? inputs.join("\n") + "\n" : "";
      if (onStdinChange) {
        onStdinChange(stdinString);
      }

      try {
        const response = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            code,
            stdin: stdinString,
            compiler,
            options: standard,
            settings: compilerSettings,
            inputMode: "interactive",
          }),
        });

        const data: CompileResponse = await response.json();
        const stdout = data.stdout || "";
        const stderr = data.stderr || "";
        const compilerOut = data.compilerOutput || "";

        // Determine if compiler error occurred
        if (compilerOut && data.exitCode !== 0 && !stdout) {
          setEntries((prev) => [
            ...prev,
            {
              id: `${Date.now()}-comp`,
              type: "stderr",
              text: `[Error de compilación]:\n${compilerOut}`,
            },
          ]);
          setIsFinished(true);
          setIsRunning(false);
          return;
        }

        // Check delta stdout
        const prevStdout = lastStdoutRef.current;
        let deltaStdout = stdout;
        if (!isInitial && prevStdout && stdout.startsWith(prevStdout)) {
          deltaStdout = stdout.slice(prevStdout.length);
        }
        lastStdoutRef.current = stdout;

        const newEntries: TerminalEntry[] = [];

        if (deltaStdout) {
          newEntries.push({
            id: `${Date.now()}-out`,
            type: "stdout",
            text: deltaStdout,
          });
        }

        // Check if stderr signals that program is waiting for next user input
        const isEofWaiting =
          stderr.includes("__INTERACTIVE_WAITING_INPUT__") ||
          stderr.includes("EOFError: EOF when reading a line") ||
          stderr.includes("EOFError");

        const cleanStderr = stderr
          .replace(/__INTERACTIVE_WAITING_INPUT__/g, "")
          .replace(/Traceback \(most recent call last\):[\s\S]*?EOFError: EOF when reading a line/g, "")
          .replace(/Traceback \(most recent call last\):[\s\S]*?EOFError/g, "")
          .trim();

        if (cleanStderr && !isEofWaiting) {
          newEntries.push({
            id: `${Date.now()}-err`,
            type: "stderr",
            text: cleanStderr,
          });
        }

        if (isEofWaiting) {
          // Program is paused waiting for user input
          setIsFinished(false);
        } else if (data.exitCode !== undefined) {
          // Program finished execution
          newEntries.push({
            id: `${Date.now()}-fin`,
            type: "system",
            text: `\n[Proceso finalizado con código de salida ${data.exitCode}]`,
          });
          setIsFinished(true);
        }

        setEntries((prev) => [...prev, ...newEntries]);
      } catch (err: unknown) {
        const error = err as Error;
        setEntries((prev) => [
          ...prev,
          {
            id: `${Date.now()}-err`,
            type: "stderr",
            text: `[Error de conexión]: ${error.message || "Fallo al comunicar con el compilador"}`,
          },
        ]);
        setIsFinished(true);
      } finally {
        setIsRunning(false);
        setTimeout(focusInput, 50);
      }
    },
    [code, compiler, compilerSettings, isRunning, language, onStdinChange, standard]
  );

  // Run or start interactive session
  const handleStart = useCallback(() => {
    lastStdoutRef.current = "";
    setInteractiveInputs([]);
    setIsFinished(false);
    setEntries([
      {
        id: `${Date.now()}-sys`,
        type: "system",
        text: `[Sesión iniciada: ./${language}_app]`,
      },
    ]);
    executeWithInputs([], true);
  }, [executeWithInputs, language]);

  // Trigger from top toolbar or Ctrl+Enter
  useEffect(() => {
    if (runTrigger && runTrigger > 0) {
      handleStart();
    }
  }, [runTrigger, handleStart]);

  // Restart / Reset
  const handleReset = () => {
    lastStdoutRef.current = "";
    setInteractiveInputs([]);
    setEntries([]);
    setIsFinished(false);
    if (onStdinChange) onStdinChange("");
    setTimeout(focusInput, 50);
  };

  // Submit single input line
  const handleInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRunning) return;

    const val = inputValue;
    const nextInputs = [...interactiveInputs, val];
    setInteractiveInputs(nextInputs);

    // Add input entry to terminal
    setEntries((prev) => [
      ...prev,
      {
        id: `${Date.now()}-in`,
        type: "input",
        text: val,
      },
    ]);

    // Save in history
    if (val.trim()) {
      setHistory((prev) => [val, ...prev.filter((h) => h !== val)]);
    }
    setHistoryIdx(-1);
    setInputValue("");

    executeWithInputs(nextInputs, false);
  };

  // Keyboard navigation for command history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0 && historyIdx < history.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInputValue(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputValue(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputValue("");
      }
    }
  };

  const handleCopy = () => {
    const text = entries
      .map((e) => (e.type === "input" ? `❯ ${e.text}` : e.text))
      .join("\n");
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-[#08090d] border border-zinc-800 rounded overflow-hidden select-text font-mono"
      role="region"
      aria-label="Consola Interactiva"
      onClick={focusInput}
    >
      {/* Header bar */}
      <div
        className="px-3 py-2 bg-[#0a0c12] border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-neon-green" />
          <span className="text-xs font-semibold text-zinc-200">
            CONSOLA INTERACTIVA
          </span>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">
            (stdin / stdout integrados)
          </span>

          {/* Status badge */}
          {isRunning ? (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Ejecutando...
            </span>
          ) : isFinished ? (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-700">
              <CheckCircle2 className="w-3 h-3 text-neon-green" />
              Finalizado
            </span>
          ) : entries.length > 0 ? (
            <span className="flex items-center gap-1 text-[11px] text-neon-cyan bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              Esperando entrada...
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Run / Restart button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={isRunning}
            className="flex items-center gap-1 px-2 py-1 rounded bg-neon-green text-black hover:bg-[#00e67a] active:bg-[#00cc6c] transition-colors text-xs font-semibold shadow-sm disabled:opacity-50"
            title="Ejecutar o reiniciar en consola interactiva (Ctrl+Enter)"
          >
            {entries.length === 0 ? (
              <>
                <Play className="w-3 h-3 fill-black" />
                <span>Ejecutar</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3 h-3" />
                <span>Reiniciar</span>
              </>
            )}
          </button>

          {/* Clear screen */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            title="Limpiar terminal"
            aria-label="Limpiar terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Copy all text */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={entries.length === 0}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30"
            title="Copiar contenido de la terminal"
            aria-label="Copiar contenido"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-neon-green" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Switch to Split Mode */}
          {onSwitchToSplit && (
            <button
              type="button"
              onClick={onSwitchToSplit}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-neon-green hover:border-neon-green/60 transition-colors text-xs"
              title="Cambiar a vista separada (Stdin y Output separados)"
            >
              <Split className="w-3 h-3 text-neon-cyan" />
              <span className="hidden sm:inline">Modo Separado</span>
            </button>
          )}

          {/* Maximize */}
          {onMaximize && (
            <button
              type="button"
              onClick={onMaximize}
              className="p-1 rounded text-zinc-400 hover:text-neon-green hover:bg-zinc-800 transition-colors"
              title={isMaximized ? "Restaurar (Esc)" : "Maximizar"}
              aria-label={isMaximized ? "Restaurar" : "Maximizar"}
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

      {/* Terminal Screen Body */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 p-3 overflow-auto text-xs leading-relaxed"
      >
        {entries.length === 0 && (
          <div className="text-zinc-600 italic select-none py-2">
            La consola está lista. Presiona &quot;Iniciar&quot; o escribe un dato y pulsa Enter para interactuar.
            <div className="mt-1 text-[11px] text-zinc-500">
              💡 Introduce cada dato uno a uno como en una consola real (std::cin, input(), readline).
            </div>
          </div>
        )}

        {entries.map((entry) => {
          if (entry.type === "input") {
            return (
              <div key={entry.id} className="flex items-center gap-1 text-neon-green font-semibold py-0.5">
                <span className="select-none text-neon-cyan font-bold">❯</span>
                <span className="whitespace-pre-wrap break-all">{entry.text}</span>
              </div>
            );
          }
          if (entry.type === "stderr") {
            return (
              <div key={entry.id} className="text-red-400 whitespace-pre-wrap break-all py-0.5">
                {entry.text}
              </div>
            );
          }
          if (entry.type === "system") {
            return (
              <div key={entry.id} className="text-zinc-500 italic py-0.5">
                {entry.text}
              </div>
            );
          }
          return (
            <div key={entry.id} className="text-zinc-200 whitespace-pre-wrap break-all py-0.2">
              {entry.text}
            </div>
          );
        })}

        {isRunning && (
          <div className="flex items-center gap-1.5 text-zinc-500 italic py-1">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
            <span>Ejecutando programa...</span>
          </div>
        )}
      </div>

      {/* Bottom Live Prompt Line */}
      <form
        onSubmit={handleInputSubmit}
        className="px-3 py-2 bg-[#06070a] border-t border-zinc-800 flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-neon-green font-bold text-xs select-none">❯</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          placeholder={
            isFinished
              ? "Proceso finalizado. Escribe para reanudar o pulsa Reiniciar."
              : "Introduce el siguiente input y presiona Enter..."
          }
          className="flex-1 bg-transparent text-zinc-100 font-mono text-xs focus:outline-none placeholder:text-zinc-600 disabled:opacity-50"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isRunning}
          className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-[11px] flex items-center gap-1 disabled:opacity-40"
          title="Enviar entrada (Enter)"
        >
          <span>Enter</span>
          <CornerDownLeft className="w-3 h-3 text-neon-green" />
        </button>
      </form>
    </div>
  );
}
