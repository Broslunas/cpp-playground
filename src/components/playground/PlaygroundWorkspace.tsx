"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/playground/Toolbar";
import { Editor } from "@/components/playground/Editor";
import { StdinPanel } from "@/components/playground/StdinPanel";
import { OutputPanel } from "@/components/playground/OutputPanel";
import { ProjectSidebar } from "@/components/playground/ProjectSidebar";
import {
  CompilerSettingsModal,
  DEFAULT_COMPILER_SETTINGS,
} from "@/components/playground/CompilerSettingsModal";
import { TemplateSelectorModal } from "@/components/playground/TemplateSelectorModal";
import { ShortcutsModal } from "@/components/playground/ShortcutsModal";
import {
  getProjectsByLanguage,
  saveLanguageProjects,
  getActiveProjectId,
  setActiveProjectId,
  createProject,
} from "@/lib/projects";
import { generateShareUrl, decodeShareableState } from "@/lib/share";
import { downloadSourceFile, generateCMakeLists, generateMakefile } from "@/lib/export";
import { formatCode } from "@/lib/formatter";
import { getLanguage } from "@/lib/languages";
import { Project, CompileResponse, CompilerSettings, CodeTemplate, SupportedLanguage } from "@/types";

interface PlaygroundWorkspaceProps {
  initialLanguage?: SupportedLanguage;
}

export function PlaygroundWorkspace({ initialLanguage = "cpp" }: PlaygroundWorkspaceProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Active project state
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [compiler, setCompiler] = useState(getLanguage(initialLanguage).defaultCompiler);
  const [standard, setStandard] = useState(getLanguage(initialLanguage).defaultStandard);
  const [compilerSettings, setCompilerSettings] = useState<CompilerSettings>(
    DEFAULT_COMPILER_SETTINGS
  );
  const [projectName, setProjectName] = useState("Loading...");

  // Modals & UI View State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<CompileResponse | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Guardado localmente ✓");

  // Resizing state & persistence
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [editorHeight, setEditorHeight] = useState(60);
  const [stdinWidth, setStdinWidth] = useState(30);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sw = localStorage.getItem("cpp_sidebar_width");
      if (sw) setSidebarWidth(Math.max(160, Math.min(500, Number(sw))));
      const eh = localStorage.getItem("cpp_editor_height");
      if (eh) setEditorHeight(Math.max(15, Math.min(85, Number(eh))));
      const siw = localStorage.getItem("cpp_stdin_width");
      if (siw) setStdinWidth(Math.max(15, Math.min(85, Number(siw))));
    } catch {}
  }, []);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Load language-specific projects on mount or route language change
  useEffect(() => {
    const currentLang = initialLanguage;
    setLanguage(currentLang);

    // Check if URL has shared code in hash
    if (typeof window !== "undefined" && window.location.hash) {
      const shared = decodeShareableState(window.location.hash);
      if (shared) {
        const sharedLang: SupportedLanguage = shared.language || currentLang;
        // If shared link belongs to another language, redirect to that playground
        if (sharedLang !== currentLang) {
          router.push(`/${sharedLang}/playground${window.location.hash}`);
          return;
        }

        const langDef = getLanguage(sharedLang);
        const sharedProject = createProject(
          "Código Compartido",
          shared.code,
          shared.standard || langDef.defaultStandard,
          shared.stdin || "",
          shared.settings || DEFAULT_COMPILER_SETTINGS,
          sharedLang
        );
        if (shared.compiler) sharedProject.compiler = shared.compiler;

        const langProjects = getProjectsByLanguage(sharedLang);
        const updated = [sharedProject, ...langProjects];
        setProjects(updated);
        saveLanguageProjects(sharedLang, updated);
        setActiveId(sharedProject.id);
        setActiveProjectId(sharedProject.id, sharedLang);
        setCode(sharedProject.code);
        setStdin(sharedProject.stdin);
        setCompiler(sharedProject.compiler);
        setStandard(sharedProject.options || langDef.defaultStandard);
        setCompilerSettings(sharedProject.settings || DEFAULT_COMPILER_SETTINGS);
        setProjectName(sharedProject.name);
        showNotification("Enlace compartido cargado ✓");
        return;
      }
    }

    const langProjects = getProjectsByLanguage(currentLang);
    setProjects(langProjects);

    const savedActiveId = getActiveProjectId(currentLang);
    const active =
      langProjects.find((p) => p.id === savedActiveId) || langProjects[0];

    if (active) {
      const langDef = getLanguage(currentLang);
      setActiveId(active.id);
      setActiveProjectId(active.id, currentLang);
      setCode(active.code);
      setStdin(active.stdin);
      setCompiler(active.compiler || langDef.defaultCompiler);
      setStandard(active.options || langDef.defaultStandard);
      setCompilerSettings(active.settings || DEFAULT_COMPILER_SETTINGS);
      setProjectName(active.name);
    }
  }, [initialLanguage, router]);

  // Save current project state for current language
  const saveCurrentProject = useCallback(() => {
    if (!activeProjectId) return;

    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              language,
              code,
              stdin,
              compiler,
              options: standard,
              settings: compilerSettings,
              updatedAt: Date.now(),
            }
          : p
      );
      saveLanguageProjects(language, updated);
      return updated;
    });

    showNotification("Proyecto guardado ✓");
  }, [activeProjectId, language, code, stdin, compiler, standard, compilerSettings]);

  // Auto-save debounced
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!activeProjectId) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveCurrentProject();
    }, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [code, stdin, compiler, standard, compilerSettings, language, saveCurrentProject, activeProjectId]);

  // Project selection within current language
  const handleSelectProject = (id: string) => {
    saveCurrentProject();

    const target = projects.find((p) => p.id === id);
    if (target) {
      setActiveId(target.id);
      setActiveProjectId(target.id, language);
      setCode(target.code);
      setStdin(target.stdin);
      setCompiler(target.compiler);
      setStandard(target.options || getLanguage(language).defaultStandard);
      setCompilerSettings(target.settings || DEFAULT_COMPILER_SETTINGS);
      setProjectName(target.name);
      setOutput(null);
    }
  };

  // Language change from toolbar -> navigates to /[language]/playground
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    if (newLang === language) return;
    saveCurrentProject();
    router.push(`/${newLang}/playground`);
  };

  // Create Project in current language
  const handleCreateProject = () => {
    const langDef = getLanguage(language);
    const newProj = createProject(
      `Proyecto ${langDef.name} ${projects.length + 1}`,
      langDef.defaultCode,
      langDef.defaultStandard,
      "",
      DEFAULT_COMPILER_SETTINGS,
      language
    );
    const updated = [newProj, ...projects];
    setProjects(updated);
    saveLanguageProjects(language, updated);
    handleSelectProject(newProj.id);
  };

  // Delete Project in current language
  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveLanguageProjects(language, updated);

    if (activeProjectId === id) {
      if (updated.length > 0) {
        handleSelectProject(updated[0].id);
      } else {
        // If deleted last project, generate a new clean project
        handleCreateProject();
      }
    }
  };

  // Rename Project
  const handleRenameProject = (id: string, newName: string) => {
    const updated = projects.map((p) =>
      p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p
    );
    setProjects(updated);
    saveLanguageProjects(language, updated);
    if (activeProjectId === id) {
      setProjectName(newName);
    }
  };

  // Load Template
  const handleSelectTemplate = (template: CodeTemplate) => {
    const templateLang = template.language || "cpp";
    const langDef = getLanguage(templateLang);

    // If template belongs to another language, redirect
    if (templateLang !== language) {
      router.push(`/${templateLang}/playground`);
      return;
    }

    const newProj = createProject(
      template.title,
      template.code,
      template.standard,
      template.stdin || "",
      DEFAULT_COMPILER_SETTINGS,
      templateLang
    );
    newProj.compiler = langDef.defaultCompiler;

    const updated = [newProj, ...projects];
    setProjects(updated);
    saveLanguageProjects(language, updated);
    handleSelectProject(newProj.id);
    showNotification(`Plantilla "${template.title}" cargada`);
  };

  // Code Formatter
  const handleFormatCode = () => {
    if (!code) return;
    const formatted = formatCode(code, language);
    setCode(formatted);
    showNotification("Código formateado ✓");
  };

  // Share via URL hash
  const handleShare = () => {
    const url = generateShareUrl({
      language,
      code,
      stdin,
      compiler,
      standard,
      settings: compilerSettings,
    });
    navigator.clipboard.writeText(url);
    showNotification("¡Enlace copiado al portapapeles!");
  };

  // Export Project Files
  const handleExport = () => {
    downloadSourceFile(projectName, code, language);
    if (language === "cpp") {
      const makefile = generateMakefile(standard, compilerSettings);
      const cmake = generateCMakeLists(projectName, standard, compilerSettings);
      console.info("Generated Makefile:\n", makefile);
      console.info("Generated CMakeLists.txt:\n", cmake);
    }
    const langDef = getLanguage(language);
    showNotification(`Descargado archivo ${langDef.extension} ✓`);
  };

  // Run/Compile program
  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(null);

    if (language === "html") {
      setTimeout(() => {
        setOutput({
          stdout: "Renderizado DOM y estilos CSS actualizados en Vista Previa.",
          stderr: "",
          compilerOutput: "HTML5/CSS3/ES6+ cargado en entorno aislado.",
          exitCode: 0,
          time: new Date().toLocaleTimeString(),
          executionTimeMs: 1,
        });
        setIsRunning(false);
      }, 150);
      return;
    }

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          stdin,
          compiler,
          options: standard,
          settings: compilerSettings,
        }),
      });

      const data: CompileResponse = await response.json();
      setOutput(data);
    } catch (err: unknown) {
      const error = err as Error;
      setOutput({
        stdout: "",
        stderr: error.message || "No se pudo conectar con el servidor de ejecución.",
        compilerOutput: "",
        exitCode: 1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      } else if (isMod && e.key === "s") {
        e.preventDefault();
        saveCurrentProject();
      } else if (isMod && e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        handleFormatCode();
      } else if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsTemplatesOpen((prev) => !prev);
      } else if (isMod && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        if (getLanguage(language).hasCompilerSettings) {
          setIsSettingsOpen((prev) => !prev);
        }
      } else if (e.key === "?" && !isMod && (document.activeElement?.tagName !== "TEXTAREA" && !document.activeElement?.classList.contains("cm-content"))) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if (e.key === "Escape") {
        setIsSettingsOpen(false);
        setIsTemplatesOpen(false);
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, stdin, compiler, standard, compilerSettings, isRunning, saveCurrentProject, language]);

  const langDef = getLanguage(language);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#090a0f]">
      {/* Top Toolbar */}
      {!isZenMode && (
        <Toolbar
          onRun={handleRun}
          onSave={saveCurrentProject}
          isRunning={isRunning}
          language={language}
          onLanguageChange={handleLanguageChange}
          compiler={compiler}
          onCompilerChange={setCompiler}
          standard={standard}
          onStandardChange={setStandard}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          projectName={projectName}
          compilerSettings={compilerSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onFormatCode={handleFormatCode}
          onShare={handleShare}
          onExport={handleExport}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
        />
      )}

      {/* Main Workspace Body */}
      <div ref={workspaceRef} className="flex flex-1 overflow-hidden relative">
        {/* Projects Sidebar */}
        {!isZenMode && (
          <>
            <ProjectSidebar
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              onRenameProject={handleRenameProject}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              width={sidebarWidth}
              languageName={langDef.name}
            />

            {/* Sidebar Resizer */}
            {isSidebarOpen && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Redimensionar barra lateral"
                className="w-1.5 hover:w-1.5 relative z-20 cursor-col-resize group shrink-0 flex items-center justify-center touch-none select-none -mx-[1px]"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                  const container = workspaceRef.current;
                  if (!container) return;
                  const rect = container.getBoundingClientRect();
                  const newWidth = Math.max(160, Math.min(500, e.clientX - rect.left));
                  setSidebarWidth(newWidth);
                  try {
                    localStorage.setItem("cpp_sidebar_width", String(newWidth));
                  } catch {}
                }}
                onPointerUp={(e) => {
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                }}
              >
                <div className="w-[2px] h-full bg-zinc-800/80 group-hover:bg-neon-green group-active:bg-neon-green transition-colors" />
              </div>
            )}
          </>
        )}

        {/* Central Workspace (Editor + Bottom I/O Panels) */}
        <main
          ref={mainRef}
          id="main-content"
          className="flex-1 flex flex-col p-2 sm:p-3 overflow-hidden relative min-w-0"
          role="main"
        >
          {/* Zen mode floating toggle */}
          {isZenMode && (
            <button
              onClick={() => setIsZenMode(false)}
              className="absolute top-4 right-4 z-40 px-2.5 py-1 rounded bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white font-mono text-xs shadow-lg flex items-center gap-1.5"
            >
              Salir de Modo Zen (Esc)
            </button>
          )}

          {/* Top: CodeMirror Editor */}
          <div
            style={{ height: `calc(${editorHeight}% - 4px)` }}
            className="w-full min-h-0 overflow-hidden"
          >
            <Editor
              value={code}
              onChange={setCode}
              onRun={handleRun}
              language={language}
              readOnly={isRunning}
            />
          </div>

          {/* Horizontal Resizer between Editor and Bottom Panels */}
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Redimensionar editor y consola"
            className="h-2 hover:h-2 relative z-10 cursor-row-resize group shrink-0 flex items-center justify-center touch-none select-none -my-0.5"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              const main = mainRef.current;
              if (!main) return;
              const rect = main.getBoundingClientRect();
              if (rect.height <= 0) return;
              const percent = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
              setEditorHeight(percent);
              try {
                localStorage.setItem("cpp_editor_height", String(percent));
              } catch {}
            }}
            onPointerUp={(e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}
            }}
          >
            <div className="h-[2px] w-full bg-zinc-800/80 group-hover:bg-neon-green group-active:bg-neon-green transition-colors" />
          </div>

          {/* Bottom: Stdin & Output Panels */}
          <div
            ref={bottomRef}
            style={{ height: `calc(${100 - editorHeight}% - 4px)` }}
            className="w-full min-h-0 flex flex-row overflow-hidden"
          >
            {language !== "html" ? (
              <>
                {/* Left: Stdin Input */}
                <div
                  style={{ width: `calc(${stdinWidth}% - 4px)` }}
                  className="h-full min-w-0 overflow-hidden"
                >
                  <StdinPanel
                    value={stdin}
                    onChange={setStdin}
                    disabled={isRunning}
                  />
                </div>

                {/* Vertical Resizer between Stdin and Output */}
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Redimensionar entrada y salida"
                  className="w-2 hover:w-2 relative z-10 cursor-col-resize group shrink-0 flex items-center justify-center touch-none select-none -mx-0.5"
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                    const bottom = bottomRef.current;
                    if (!bottom) return;
                    const rect = bottom.getBoundingClientRect();
                    if (rect.width <= 0) return;
                    const percent = Math.max(15, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
                    setStdinWidth(percent);
                    try {
                      localStorage.setItem("cpp_stdin_width", String(percent));
                    } catch {}
                  }}
                  onPointerUp={(e) => {
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                  }}
                >
                  <div className="w-[2px] h-full bg-zinc-800/80 group-hover:bg-neon-green group-active:bg-neon-green transition-colors" />
                </div>

                {/* Right: Output Panel */}
                <div
                  style={{ width: `calc(${100 - stdinWidth}% - 4px)` }}
                  className="h-full min-w-0 overflow-hidden flex-1"
                >
                  <OutputPanel
                    result={output}
                    isRunning={isRunning}
                    onClear={() => setOutput(null)}
                    language={language}
                    code={code}
                  />
                </div>
              </>
            ) : (
              /* Full Width Output & Live Preview for HTML/CSS/JS */
              <div className="w-full h-full min-w-0 overflow-hidden">
                <OutputPanel
                  result={output}
                  isRunning={isRunning}
                  onClear={() => setOutput(null)}
                  language={language}
                  code={code}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CompilerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={compilerSettings}
        onChange={setCompilerSettings}
      />

      <TemplateSelectorModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        currentLanguage={language}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Toast Notification */}
      {saveToast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 bg-neon-green text-black px-3.5 py-2 rounded shadow-2xl text-xs font-mono font-bold transition-all duration-300 z-50 pointer-events-none"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
