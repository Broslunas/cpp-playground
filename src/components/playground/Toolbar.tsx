"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Edit2,
} from "lucide-react";
import { SUPPORTED_LANGUAGES_LIST, getLanguage } from "@/lib/languages";
import {
  CompilerSettings,
  SupportedLanguage,
  PlaygroundLayout,
  CloudSyncState,
  AuthUser,
  CppExercise,
} from "@/types";
import { LayoutSelector } from "@/components/playground/LayoutSelector";
import { CloudSyncStatus } from "@/components/playground/CloudSyncStatus";
import { UserMenu } from "@/components/auth/UserMenu";

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
  onProjectNameChange?: (newName: string) => void;
  compilerSettings: CompilerSettings;
  hasActiveProject?: boolean;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onOpenShortcuts: () => void;
  onFormatCode: () => void;
  onShare: () => void;
  onExport: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  layout: PlaygroundLayout;
  onLayoutChange: (layout: PlaygroundLayout) => void;
  showStdin: boolean;
  onToggleStdin: () => void;
  onResetSizes: () => void;
  onOpenCustomModal?: () => void;
  syncStatus?: CloudSyncState;
  onPull?: () => void;
  onPush?: () => void;
  onBidirectionalSync?: () => void;
  authUser?: AuthUser | null;
  onUserChange?: (user: AuthUser | null) => void;
  exercise?: CppExercise | null;
  onToggleExerciseDetails?: () => void;
  isExerciseDetailsOpen?: boolean;
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
  onProjectNameChange,
  hasActiveProject = true,
  compilerSettings,
  onOpenSettings,
  onOpenTemplates,
  onOpenShortcuts,
  onFormatCode,
  onShare,
  onExport,
  isZenMode,
  onToggleZenMode,
  layout,
  onLayoutChange,
  showStdin,
  onToggleStdin,
  onResetSizes,
  onOpenCustomModal,
  syncStatus = "idle",
  onPull,
  onPush,
  onBidirectionalSync,
  authUser,
  onUserChange,
  exercise,
  onToggleExerciseDetails,
  isExerciseDetailsOpen = false,
}: ToolbarProps) {
  const [copiedShare, setCopiedShare] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [inputName, setInputName] = useState(projectName);
  const isSubmittingName = useRef(false);

  useEffect(() => {
    setInputName(projectName);
  }, [projectName]);

  const handleNameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingName.current) return;
    isSubmittingName.current = true;

    const trimmed = inputName.trim();
    if (trimmed && trimmed !== projectName) {
      onProjectNameChange?.(trimmed);
    } else {
      setInputName(projectName);
    }
    setIsEditingName(false);
    queueMicrotask(() => {
      isSubmittingName.current = false;
    });
  };

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

  // PWA install prompt handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice?.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="h-14 border-b border-zinc-800 bg-[#090a0f] px-3 sm:px-4 flex items-center justify-between gap-3 select-none font-mono text-xs">
      {/* Left Section: navigation & project title */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          href="/playground"
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          title="Volver al selector de Playgrounds"
          aria-label="Volver al selector de Playgrounds"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded transition-colors flex items-center justify-center text-xs ${
            isSidebarOpen
              ? "bg-zinc-800 text-neon-green"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
          }`}
          title={isSidebarOpen ? "Ocultar panel de proyectos" : "Mostrar panel de proyectos"}
          aria-label={isSidebarOpen ? "Ocultar panel de proyectos" : "Mostrar panel de proyectos"}
          aria-expanded={isSidebarOpen}
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-2 max-w-[170px] sm:max-w-[260px] truncate">
          <Terminal className={`w-3.5 h-3.5 shrink-0 ${hasActiveProject ? "text-neon-green" : "text-zinc-600"}`} />
          {isEditingName && hasActiveProject ? (
            <form onSubmit={handleNameSubmit} className="flex items-center gap-1 min-w-0">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onBlur={() => handleNameSubmit()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setInputName(projectName);
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                className="bg-zinc-950 border border-neon-green/80 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-[110px] sm:w-[150px]"
                placeholder="Nombre del proyecto"
              />
              <button
                type="submit"
                className="p-1 text-neon-green hover:bg-zinc-800 rounded"
                aria-label="Confirmar nombre"
              >
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (hasActiveProject && onProjectNameChange) {
                  setInputName(projectName);
                  setIsEditingName(true);
                }
              }}
              disabled={!hasActiveProject || !onProjectNameChange}
              className={`flex items-center gap-1.5 truncate group/name text-left ${
                hasActiveProject && onProjectNameChange ? "cursor-pointer hover:opacity-90" : "cursor-default"
              }`}
              title={hasActiveProject && onProjectNameChange ? "Clic para editar nombre del proyecto" : undefined}
            >
              <span className={`font-medium truncate ${!hasActiveProject ? "text-zinc-500 italic" : "text-zinc-200 group-hover/name:text-white transition-colors"}`}>
                {projectName || "Sin proyectos"}
              </span>
              {hasActiveProject && onProjectNameChange && (
                <Edit2 className="w-3 h-3 text-zinc-500 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
              )}
            </button>
          )}
          <CloudSyncStatus
            status={syncStatus}
            onPull={onPull}
            onPush={onPush}
            onBidirectionalSync={onBidirectionalSync}
            isLoggedIn={Boolean(authUser)}
          />

          {exercise && (
            <button
              type="button"
              onClick={onToggleExerciseDetails}
              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1.5 border transition-colors ${
                isExerciseDetailsOpen
                  ? "bg-neon-green/20 text-neon-green border-neon-green/40"
                  : "bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700"
              }`}
              title="Ver enunciado y pistas del ejercicio"
            >
              <BookOpen className="w-3.5 h-3.5 text-neon-green" />
              <span className="hidden sm:inline">Enunciado</span>
            </button>
          )}
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
            disabled={!hasActiveProject}
            className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
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
            disabled={!hasActiveProject}
            className="p-1.5 rounded text-zinc-400 hover:text-neon-green hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
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
            disabled={!hasActiveProject}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
            title={`Exportar archivo (${langDef.extension})`}
            aria-label={`Exportar archivo (${langDef.extension})`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <LayoutSelector
            layout={layout}
            onLayoutChange={onLayoutChange}
            showStdin={showStdin}
            onToggleStdin={onToggleStdin}
            onResetSizes={onResetSizes}
            onOpenCustomModal={onOpenCustomModal}
            isHtml={Boolean(langDef.isWebPreview || language === "html")}
          />
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
          disabled={isRunning || !hasActiveProject}
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors focus:outline-none disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
          title="Guardar Proyecto (Ctrl+S)"
          aria-label="Guardar Proyecto"
        >
          <Save className="w-3.5 h-3.5" />
        </button>

        {/* Run Button (Primary CTA) */}
        <button
          onClick={onRun}
          disabled={isRunning || !hasActiveProject}
          className="px-3.5 py-1.5 rounded bg-neon-green text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-[#00e67a] active:bg-[#00cc6c] transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] focus:outline-none focus:ring-2 focus:ring-neon-green disabled:opacity-40 disabled:hover:bg-neon-green shrink-0"
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

        {/* PWA Install Button */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-neon-green/15 text-neon-green border border-neon-green/40 hover:bg-neon-green/25 text-xs font-semibold transition-all shadow-[0_0_10px_rgba(0,255,136,0.15)]"
            title="Instalar Broslunas Playground como aplicación"
            aria-label="Instalar app"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

        {/* User Account / Login */}
        <UserMenu compact onUserChange={onUserChange} />
      </div>
    </header>
  );
}
