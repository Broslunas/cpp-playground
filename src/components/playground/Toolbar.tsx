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
  Menu,
  X,
  Layout,
  Columns2,
  Columns3,
  Rows3,
  SlidersHorizontal,
  Eye,
  EyeOff,
  RotateCcw,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  User,
  LogIn,
} from "lucide-react";
import { SUPPORTED_LANGUAGES_LIST, getLanguage } from "@/lib/languages";
import {
  CompilerSettings,
  SupportedLanguage,
  PlaygroundLayout,
  CloudSyncState,
  AuthUser,
} from "@/types";
import { LayoutSelector } from "@/components/playground/LayoutSelector";
import { CloudSyncStatus } from "@/components/playground/CloudSyncStatus";
import { UserMenu } from "@/components/auth/UserMenu";

const LAYOUT_QUICK_OPTIONS: {
  id: PlaygroundLayout;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "standard", title: "Estándar", icon: Layout },
  { id: "two-column", title: "2 Col", icon: Columns2 },
  { id: "columns", title: "3 Col", icon: Columns3 },
  { id: "vertical", title: "Vertical", icon: Rows3 },
  { id: "custom", title: "Libre", icon: SlidersHorizontal },
];

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
}: ToolbarProps) {
  const [copiedShare, setCopiedShare] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [inputName, setInputName] = useState(projectName);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  // PWA install prompt handler & dismiss state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallDismissed, setIsInstallDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("pwa_install_dismissed") === "true") {
        setIsInstallDismissed(true);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }

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
      setIsInstallDismissed(true);
      try {
        localStorage.setItem("pwa_install_dismissed", "true");
      } catch {}
    }
  };

  const handleDismissInstall = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsInstallDismissed(true);
    try {
      localStorage.setItem("pwa_install_dismissed", "true");
    } catch {}
  };

  const handleRestoreInstall = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsInstallDismissed(false);
    try {
      localStorage.removeItem("pwa_install_dismissed");
    } catch {}
  };

  // Close drawer on escape key and prevent body scroll when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="h-14 border-b border-zinc-800 bg-[#090a0f] px-2.5 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 select-none font-mono text-xs w-full">
        {/* Left Section: navigation, project title & sync */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink min-w-0">
          <Link
            href="/playground"
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0"
            title="Volver al selector de Playgrounds"
            aria-label="Volver al selector de Playgrounds"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded transition-colors flex items-center justify-center text-xs shrink-0 ${
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

          <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block shrink-0" />

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
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
                  className="bg-zinc-950 border border-neon-green/80 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-[90px] min-[400px]:w-[120px] sm:w-[150px]"
                  placeholder="Nombre del proyecto"
                />
                <button
                  type="submit"
                  className="p-1 text-neon-green hover:bg-zinc-800 rounded shrink-0"
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
                className={`flex items-center gap-1 truncate group/name text-left min-w-0 max-w-[80px] min-[380px]:max-w-[120px] sm:max-w-[180px] md:max-w-[240px] ${
                  hasActiveProject && onProjectNameChange ? "cursor-pointer hover:opacity-90" : "cursor-default"
                }`}
                title={hasActiveProject && onProjectNameChange ? "Clic para editar nombre del proyecto" : undefined}
              >
                <span className={`font-medium truncate ${!hasActiveProject ? "text-zinc-500 italic" : "text-zinc-200 group-hover/name:text-white transition-colors"}`}>
                  {projectName || "Sin proyectos"}
                </span>
                {hasActiveProject && onProjectNameChange && (
                  <Edit2 className="w-3 h-3 text-zinc-500 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0 hidden min-[400px]:inline-block" />
                )}
              </button>
            )}

            <div className="shrink-0">
              <CloudSyncStatus
                status={syncStatus}
                onPull={onPull}
                onPush={onPush}
                onBidirectionalSync={onBidirectionalSync}
                isLoggedIn={Boolean(authUser)}
              />
            </div>
          </div>
        </div>

        {/* Right Section: Desktop toolbar (xl+) OR Compact Bar + Hamburger menu (< xl) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Complete Desktop Tool Group - Visible when everything fits (xl+) */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded p-0.5 shrink-0">
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

            <div className="h-4 w-[1px] bg-zinc-800 shrink-0" />

            {/* Language Selector */}
            <div className="flex items-center shrink-0">
              <label htmlFor="language-select-desktop" className="sr-only">
                Lenguaje
              </label>
              <select
                id="language-select-desktop"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                disabled={isRunning}
                className="bg-zinc-900 border border-zinc-700 text-neon-green font-semibold text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-neon-green disabled:opacity-50 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES_LIST.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Compiler Selector */}
            <div className="flex items-center shrink-0">
              <label htmlFor="compiler-select-desktop" className="sr-only">
                Compilador / Intérprete
              </label>
              <select
                id="compiler-select-desktop"
                value={compiler}
                onChange={(e) => onCompilerChange(e.target.value)}
                disabled={isRunning}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-neon-green disabled:opacity-50 max-w-[150px] truncate cursor-pointer"
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
              <div className="flex items-center shrink-0">
                <label htmlFor="standard-select-desktop" className="sr-only">
                  Estándar / Versión
                </label>
                <select
                  id="standard-select-desktop"
                  value={standard}
                  onChange={(e) => onStandardChange(e.target.value)}
                  disabled={isRunning}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-neon-green disabled:opacity-50 cursor-pointer"
                >
                  {currentCompiler.standards.map((std) => (
                    <option key={std} value={std}>
                      {std.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="h-4 w-[1px] bg-zinc-800 shrink-0" />

            {/* Shortcuts Help */}
            <button
              onClick={onOpenShortcuts}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
              title="Atajos de teclado (?)"
              aria-label="Atajos de teclado"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Zen Mode Toggle */}
            <button
              onClick={onToggleZenMode}
              className={`p-1.5 rounded transition-colors shrink-0 ${
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

            {/* PWA Install Button (with eliminate/dismiss button) */}
            {deferredPrompt && !isInstallDismissed && (
              <div className="flex items-center rounded bg-neon-green/15 border border-neon-green/40 shadow-[0_0_10px_rgba(0,255,136,0.15)] overflow-hidden shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 px-2 py-1 text-neon-green hover:bg-neon-green/20 text-xs font-semibold transition-colors"
                  title="Instalar ejecuta.tech como aplicación"
                  aria-label="Instalar app"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Instalar</span>
                </button>
                <button
                  onClick={handleDismissInstall}
                  className="p-1 text-neon-green/70 hover:text-white hover:bg-red-500/30 border-l border-neon-green/30 transition-colors"
                  title="Eliminar botón de instalar"
                  aria-label="Eliminar botón de instalar"
                >
                  <X className="w-3 h-3 shrink-0" />
                </button>
              </div>
            )}
          </div>

          {/* Compact View for when screen does not fit all options (< xl) */}
          <div className="flex items-center gap-1.5 sm:gap-2 xl:hidden shrink-0">
            {/* Compact Language Selector */}
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              disabled={isRunning}
              className="bg-zinc-900 border border-zinc-700 text-neon-green font-semibold text-xs font-mono rounded px-1.5 sm:px-2 py-1 sm:py-1.5 focus:outline-none focus:border-neon-green disabled:opacity-50 max-w-[80px] min-[400px]:max-w-[100px] cursor-pointer"
              aria-label="Seleccionar lenguaje"
            >
              {SUPPORTED_LANGUAGES_LIST.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Always Visible: Save Button */}
          <button
            onClick={onSave}
            disabled={isRunning || !hasActiveProject}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors focus:outline-none disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:bg-transparent shrink-0"
            title="Guardar Proyecto (Ctrl+S)"
            aria-label="Guardar Proyecto"
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          {/* Always Visible: Run Primary CTA Button */}
          <button
            onClick={onRun}
            disabled={isRunning || !hasActiveProject}
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded bg-neon-green text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-[#00e67a] active:bg-[#00cc6c] transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] focus:outline-none focus:ring-2 focus:ring-neon-green disabled:opacity-40 disabled:hover:bg-neon-green shrink-0"
            aria-label={isRunning ? "Ejecutando..." : "Ejecutar (Ctrl+Enter)"}
            aria-busy={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden min-[400px]:inline">Ejecutando...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run</span>
                <kbd className="hidden 2xl:inline-block ml-1 text-[10px] bg-black/20 px-1 py-0.2 rounded font-sans opacity-80">
                  Ctrl+↵
                </kbd>
              </>
            )}
          </button>

          {/* Always Visible: User Account / Login */}
          <div className="h-4 w-[1px] bg-zinc-800 hidden min-[480px]:block shrink-0" />
          <UserMenu compact onUserChange={onUserChange} />

          {/* Hamburger Menu Button - Shown when controls don't fit horizontally (< xl) */}
          <div className="xl:hidden shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center shrink-0 border ${
                isMenuOpen
                  ? "bg-zinc-800 text-neon-green border-neon-green/40 shadow-[0_0_10px_rgba(0,255,136,0.2)]"
                  : "bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 border-zinc-750"
              }`}
              title="Abrir menú de herramientas y opciones"
              aria-label="Abrir menú de herramientas"
              aria-expanded={isMenuOpen}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hamburger Slide-Over Drawer with ALL Options */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end xl:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-84 sm:w-96 max-w-[90vw] h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col font-mono text-xs text-zinc-200 overflow-hidden animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-900/80 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neon-green" />
                <span className="font-bold text-sm text-white">Menú Playground</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Cerrar menú"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 divide-y divide-zinc-850">
              {/* Seccion 1: Ejecucion y Guardado Rapido */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Acciones Principales
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRun();
                      setIsMenuOpen(false);
                    }}
                    disabled={isRunning || !hasActiveProject}
                    className="p-2.5 rounded-lg bg-neon-green text-black font-bold flex items-center justify-center gap-2 hover:bg-[#00e67a] active:bg-[#00cc6c] transition-all disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Ejecutando...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Run (Ctrl+↵)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSave();
                      setIsMenuOpen(false);
                    }}
                    disabled={isRunning || !hasActiveProject}
                    className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-neon-green" />
                    <span>Guardar (Ctrl+S)</span>
                  </button>
                </div>
              </div>

              {/* Seccion 2: Compilador, Lenguaje y Version */}
              <div className="space-y-3 pt-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Configuración del Entorno
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Lenguaje de Programación</label>
                  <select
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                    disabled={isRunning}
                    className="w-full bg-zinc-900 border border-zinc-700 text-neon-green font-semibold rounded px-2.5 py-2 focus:outline-none focus:border-neon-green"
                  >
                    {SUPPORTED_LANGUAGES_LIST.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Compilador / Intérprete</label>
                  <select
                    value={compiler}
                    onChange={(e) => onCompilerChange(e.target.value)}
                    disabled={isRunning}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-2 focus:outline-none focus:border-neon-green"
                  >
                    {availableCompilers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {currentCompiler?.standards && currentCompiler.standards.length > 0 && (
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Estándar / Versión</label>
                    <select
                      value={standard}
                      onChange={(e) => onStandardChange(e.target.value)}
                      disabled={isRunning}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-2 focus:outline-none focus:border-neon-green"
                    >
                      {currentCompiler.standards.map((std) => (
                        <option key={std} value={std}>
                          {std.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Seccion 3: Herramientas de Edicion y Codigo */}
              <div className="space-y-1.5 pt-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Herramientas de Código
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onOpenTemplates();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 hover:text-cyan-400 border border-zinc-800/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Plantillas y Algoritmos</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">Ctrl+K</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onFormatCode();
                    setIsMenuOpen(false);
                  }}
                  disabled={!hasActiveProject}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 hover:text-amber-400 border border-zinc-800/80 transition-colors text-left disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Formatear Código</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">Ctrl+Shift+F</span>
                </button>

                {langDef.hasCompilerSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettings();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 hover:text-neon-green border border-zinc-800/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders className="w-4 h-4 text-neon-green" />
                      <span>Opciones de Compilador y Sanitizers</span>
                    </div>
                    {hasSpecialFlags ? (
                      <span className="w-2 h-2 rounded-full bg-neon-green ring-2 ring-black" />
                    ) : (
                      <span className="text-[10px] text-zinc-500">Ctrl+B</span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleShareClick();
                    setIsMenuOpen(false);
                  }}
                  disabled={!hasActiveProject}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 hover:text-neon-green border border-zinc-800/80 transition-colors text-left disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 className="w-4 h-4 text-zinc-400" />
                    <span>Compartir Enlace</span>
                  </div>
                  {copiedShare && <span className="text-neon-green text-[10px]">Copiado ✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExport();
                    setIsMenuOpen(false);
                  }}
                  disabled={!hasActiveProject}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 hover:text-white border border-zinc-800/80 transition-colors text-left disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-zinc-400" />
                  <span>Exportar Archivo ({langDef.extension})</span>
                </button>
              </div>

              {/* Seccion 4: Disposicion de Paneles y Workspace */}
              <div className="space-y-2 pt-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Disposición de Paneles
                </div>

                <div className="grid grid-cols-5 gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  {LAYOUT_QUICK_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = layout === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onLayoutChange(opt.id);
                          if (opt.id === "custom") {
                            onOpenCustomModal?.();
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded transition-colors ${
                          isSelected
                            ? "bg-neon-green/20 text-neon-green border border-neon-green/40"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                        }`}
                        title={opt.title}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[9px] mt-1 truncate">{opt.title}</span>
                      </button>
                    );
                  })}
                </div>

                {!langDef.isWebPreview && language !== "html" && (
                  <button
                    type="button"
                    onClick={onToggleStdin}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 border border-zinc-800/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {showStdin ? (
                        <Eye className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-zinc-500" />
                      )}
                      <span>Panel Entrada (stdin)</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        showStdin
                          ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {showStdin ? "Visible" : "Oculto"}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onResetSizes();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800/80 transition-colors text-left"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restablecer proporciones de paneles</span>
                </button>
              </div>

              {/* Seccion 5: Visualizacion, Proyectos y Ayuda */}
              <div className="space-y-1.5 pt-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Vista y Navegación
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleZenMode();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 border border-zinc-800/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {isZenMode ? (
                      <Minimize2 className="w-4 h-4 text-neon-green" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-zinc-400" />
                    )}
                    <span>{isZenMode ? "Salir de Modo Zen" : "Modo Zen"}</span>
                  </div>
                  {isZenMode && <span className="text-neon-green text-[10px]">Activo</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleSidebar();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 border border-zinc-800/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderOpen className="w-4 h-4 text-zinc-400" />
                    <span>Panel de Proyectos</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {isSidebarOpen ? "Abierto" : "Cerrado"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenShortcuts();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 border border-zinc-800/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-zinc-400" />
                    <span>Atajos de Teclado</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">?</span>
                </button>
              </div>

              {/* Seccion 6: Sincronizacion en la Nube */}
              <div className="space-y-2 pt-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Nube (MongoDB + R2)
                </div>

                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Estado:</span>
                    <span className="text-neon-green font-semibold capitalize">{syncStatus}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onBidirectionalSync?.();
                        setIsMenuOpen(false);
                      }}
                      className="p-1.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white flex flex-col items-center gap-1 text-[10px] transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-neon-green" />
                      <span>Auto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onPush?.();
                        setIsMenuOpen(false);
                      }}
                      className="p-1.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white flex flex-col items-center gap-1 text-[10px] transition-colors"
                    >
                      <CloudUpload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Push</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onPull?.();
                        setIsMenuOpen(false);
                      }}
                      className="p-1.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white flex flex-col items-center gap-1 text-[10px] transition-colors"
                    >
                      <CloudDownload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pull</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Seccion 7: Instalar PWA (con eliminacion y restauracion) */}
              {deferredPrompt && (
                <div className="space-y-2 pt-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Aplicación PWA
                  </div>

                  {!isInstallDismissed ? (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green">
                      <button
                        type="button"
                        onClick={() => {
                          handleInstallClick();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 font-semibold hover:underline"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>Instalar como Aplicación</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDismissInstall}
                        className="p-1.5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded transition-colors"
                        title="Eliminar botón de instalar"
                        aria-label="Eliminar botón de instalar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRestoreInstall}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors text-center w-full py-2 bg-zinc-900/50 rounded-lg border border-zinc-800/80 hover:border-zinc-700"
                    >
                      Restaurar botón de instalar app
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0">
              <Link
                href="/playground"
                onClick={() => setIsMenuOpen(false)}
                className="text-zinc-400 hover:text-white flex items-center gap-1.5 text-xs py-1 px-2 rounded hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Selector de Playgrounds</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
