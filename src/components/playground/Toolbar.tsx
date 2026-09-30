"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  Loader2,
  Save,
  FolderOpen,
  ArrowLeft,
  Terminal,
  Sliders,
  BookOpen,
  Share2,
  Download,
  Sparkles,
  HelpCircle,
  Maximize2,
  Minimize2,
  Check,
} from "lucide-react";
import { SUPPORTED_LANGUAGES_LIST, getLanguage } from "@/lib/languages";
import { CompilerSettings, SupportedLanguage } from "@/types";

interface ToolbarProps {
  onRun: () => void;
  onSave: () => void;
  isRunning: boolean;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  compiler: string;
  onCompilerChange: (compiler: string) => void;
  standard: string;
  onStandardChange: (standard: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  projectName: string;
  compilerSettings: CompilerSettings;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onOpenShortcuts: () => void;
  onFormatCode: () => void;
  onShare: () => void;
  onExport: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
}

export function Toolbar({
  onRun,
  onSave,
  isRunning,
  language,
  onLanguageChange,
  compiler,
  onCompilerChange,
  standard,
  onStandardChange,
  onToggleSidebar,
  isSidebarOpen,
  projectName,
  compilerSettings,
  onOpenSettings,
  onOpenTemplates,
  onOpenShortcuts,
  onFormatCode,
  onShare,
  onExport,
  isZenMode,
  onToggleZenMode,
}: ToolbarProps) {
  const [copiedShare, setCopiedShare] = useState(false);

  const langDef = getLanguage(language);
  const availableCompilers = langDef.compilers;
  const currentCompiler =
    availableCompilers.find((c) => c.id === compiler) || availableCompilers[0];

  const handleShareClick = () => {
    onShare();
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const hasSpecialFlags =
    langDef.hasCompilerSettings &&
    (compilerSettings.sanitizers.length > 0 ||
      compilerSettings.optimization !== "-O2" ||
      compilerSettings.customFlags.trim().length > 0);

  return (
    <header className="h-14 border-b border-zinc-800 bg-[#090a0f] px-3 sm:px-4 flex items-center justify-between gap-3 select-none font-mono text-xs">
      {/* Left Section: navigation & project title */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          href="/"
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          title="Regresar a la página principal"
          aria-label="Regresar a la página principal"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded border transition-colors flex items-center gap-1.5 text-xs ${
            isSidebarOpen
              ? "bg-zinc-800 border-zinc-700 text-neon-green"
              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
          }`}
          aria-label={isSidebarOpen ? "Cerrar barra de proyectos" : "Abrir barra de proyectos"}
          aria-expanded={isSidebarOpen}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Proyectos</span>
        </button>

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-1.5 max-w-[140px] sm:max-w-[200px] truncate">
          <Terminal className="w-3.5 h-3.5 text-neon-green shrink-0" />
          <span className="font-medium text-zinc-200 truncate">
            {projectName}
          </span>
        </div>
      </div>

      {/* Right Section: Compact Icon Toolbar + Compilers + Run CTA */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Compact Integrated Tool Group */}
        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded p-0.5">
          <button
            onClick={onOpenTemplates}
            className="p-1.5 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
            title="Plantillas y Algoritmos (Ctrl+K)"
            aria-label="Abrir plantillas de código"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onFormatCode}
            className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
            title={`Formatear código ${langDef.name} (Ctrl+Shift+F)`}
            aria-label={`Formatear código ${langDef.name}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {langDef.hasCompilerSettings && (
            <button
              onClick={onOpenSettings}
              className={`relative p-1.5 rounded transition-colors ${
                hasSpecialFlags
                  ? "text-neon-green hover:bg-zinc-800"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
              title="Opciones del compilador y sanitizers (Ctrl+B)"
              aria-label="Opciones del compilador"
            >
              <Sliders className="w-3.5 h-3.5" />
              {hasSpecialFlags && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-neon-green ring-2 ring-black" />
              )}
            </button>
          )}

          <button
            onClick={handleShareClick}
            className="p-1.5 rounded text-zinc-400 hover:text-neon-green hover:bg-zinc-800 transition-colors"
            title={copiedShare ? "¡Enlace copiado!" : "Compartir enlace"}
            aria-label="Compartir enlace de código"
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-neon-green animate-in fade-in" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onExport}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={`Exportar archivo (${langDef.extension})`}
            aria-label={`Exportar archivo (${langDef.extension})`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

        {/* Language Selector */}
        <div className="flex items-center">
          <label htmlFor="language-select" className="sr-only">
            Lenguaje
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            disabled={isRunning}
            className="bg-zinc-900 border border-zinc-700 text-neon-green font-semibold text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-neon-green disabled:opacity-50"
          >
            {SUPPORTED_LANGUAGES_LIST.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Compiler / Interpreter Dropdown */}
        <div className="flex items-center">
          <label htmlFor="compiler-select" className="sr-only">
            Compilador / Intérprete
          </label>
          <select
            id="compiler-select"
            value={compiler}
            onChange={(e) => onCompilerChange(e.target.value)}
            disabled={isRunning}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-neon-green disabled:opacity-50"
          >
            {availableCompilers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Version / Standard Dropdown */}
        {currentCompiler?.standards && currentCompiler.standards.length > 0 && (
          <div className="hidden sm:flex items-center">
            <label htmlFor="standard-select" className="sr-only">
              Estándar / Versión
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
        )}

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isRunning}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-xs flex items-center gap-1.5 transition-colors focus:outline-none disabled:opacity-50"
          title="Guardar Proyecto (Ctrl+S)"
          aria-label="Guardar Proyecto"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Guardar</span>
        </button>

        {/* Run Button (Primary CTA) */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="px-3.5 py-1.5 rounded bg-neon-green text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-[#00e67a] active:bg-[#00cc6c] transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] focus:outline-none focus:ring-2 focus:ring-neon-green disabled:opacity-50 shrink-0"
          aria-label={isRunning ? "Ejecutando..." : "Ejecutar (Ctrl+Enter)"}
          aria-busy={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Ejecutando...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
              <kbd className="hidden lg:inline-block ml-1 text-[10px] bg-black/20 px-1 py-0.2 rounded font-sans opacity-80">
                Ctrl+↵
              </kbd>
            </>
          )}
        </button>

        <div className="h-4 w-[1px] bg-zinc-800 hidden md:block" />

        {/* Shortcuts Help */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors hidden md:block"
          title="Atajos de teclado (?)"
          aria-label="Atajos de teclado"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Zen Mode Toggle */}
        <button
          onClick={onToggleZenMode}
          className={`p-1.5 rounded transition-colors hidden md:block ${
            isZenMode
              ? "bg-neon-green text-black hover:bg-[#00e67a]"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
          title={isZenMode ? "Salir de Modo Zen" : "Modo Zen"}
          aria-label={isZenMode ? "Salir de Modo Zen" : "Modo Zen"}
        >
          {isZenMode ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </header>
  );
}
