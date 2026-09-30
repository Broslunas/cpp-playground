"use client";

import React from "react";
import Link from "next/link";
import { Play, Loader2, Save, FolderOpen, ArrowLeft, Terminal } from "lucide-react";
import { AVAILABLE_COMPILERS } from "@/lib/compiler";

interface ToolbarProps {
  onRun: () => void;
  onSave: () => void;
  isRunning: boolean;
  compiler: string;
  onCompilerChange: (compiler: string) => void;
  standard: string;
  onStandardChange: (standard: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  projectName: string;
}

export function Toolbar({
  onRun,
  onSave,
  isRunning,
  compiler,
  onCompilerChange,
  standard,
  onStandardChange,
  onToggleSidebar,
  isSidebarOpen,
  projectName,
}: ToolbarProps) {
  const currentCompiler =
    AVAILABLE_COMPILERS.find((c) => c.id === compiler) || AVAILABLE_COMPILERS[0];

  return (
    <header className="h-14 border-b border-zinc-800 bg-[#090a0f] px-3 sm:px-4 flex items-center justify-between gap-2 select-none">
      {/* Left section: navigation & project */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          title="Back to Landing Page"
          aria-label="Back to Landing Page"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded border transition-colors flex items-center gap-1.5 text-xs font-mono ${
            isSidebarOpen
              ? "bg-zinc-800 border-zinc-700 text-neon-green"
              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
          }`}
          aria-label={isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"}
          aria-expanded={isSidebarOpen}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Projects</span>
        </button>

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-1.5 max-w-[120px] sm:max-w-[200px] truncate">
          <Terminal className="w-3.5 h-3.5 text-neon-green shrink-0" />
          <span className="text-xs font-mono font-medium text-zinc-200 truncate">
            {projectName}
          </span>
        </div>
      </div>

      {/* Middle/Right section: Controls */}
      <div className="flex items-center gap-2">
        {/* Compiler Selector */}
        <div className="flex items-center">
          <label htmlFor="compiler-select" className="sr-only">
            Select Compiler
          </label>
          <select
            id="compiler-select"
            value={compiler}
            onChange={(e) => onCompilerChange(e.target.value)}
            disabled={isRunning}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-neon-green disabled:opacity-50"
          >
            {AVAILABLE_COMPILERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Standard Selector */}
        <div className="hidden sm:flex items-center">
          <label htmlFor="standard-select" className="sr-only">
            Select C++ Standard
          </label>
          <select
            id="standard-select"
            value={standard}
            onChange={(e) => onStandardChange(e.target.value)}
            disabled={isRunning}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-neon-green disabled:opacity-50"
          >
            {currentCompiler.standards.map((std) => (
              <option key={std} value={std}>
                {std.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={isRunning}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-xs font-mono flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50"
          title="Save Project"
          aria-label="Save Project"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Run button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="px-3 sm:px-4 py-1.5 rounded bg-neon-green text-black font-semibold text-xs font-mono flex items-center gap-1.5 hover:bg-[#00e67a] active:bg-[#00cc6c] transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] focus:outline-none focus:ring-2 focus:ring-neon-green focus:ring-offset-2 focus:ring-offset-[#090a0f] disabled:opacity-50"
          aria-label={isRunning ? "Compiling and running code..." : "Run C++ program (Ctrl+Enter)"}
          aria-busy={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
              <kbd className="hidden md:inline-block ml-1 text-[10px] bg-black/20 px-1 py-0.2 rounded font-sans opacity-80">
                Ctrl+↵
              </kbd>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
