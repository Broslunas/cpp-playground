"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  getProjects,
  saveProjects,
  getActiveProjectId,
  setActiveProjectId,
  createProject,
} from "@/lib/projects";
import { generateShareUrl, decodeShareableState } from "@/lib/share";
import { downloadCcFile, generateCMakeLists, generateMakefile } from "@/lib/export";
import { formatCppCode } from "@/lib/formatter";
import { Project, CompileResponse, CompilerSettings, CodeTemplate } from "@/types";

export default function PlaygroundPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Active project state
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [compiler, setCompiler] = useState("gcc-head");
  const [standard, setStandard] = useState("c++20");
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

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Initialize: check URL hash first (for shared links), fallback to localStorage
  useEffect(() => {
    const loadedProjects = getProjects();
    setProjects(loadedProjects);

    // Check if URL has shared code in hash
    if (typeof window !== "undefined" && window.location.hash) {
      const shared = decodeShareableState(window.location.hash);
      if (shared) {
        const sharedProject = createProject(
          "Código Compartido",
          shared.code,
          shared.standard || "c++20",
          shared.stdin || "",
          shared.settings || DEFAULT_COMPILER_SETTINGS
        );
        if (shared.compiler) sharedProject.compiler = shared.compiler;

        const updated = [sharedProject, ...loadedProjects];
        setProjects(updated);
        saveProjects(updated);
        setActiveId(sharedProject.id);
        setActiveProjectId(sharedProject.id);
        setCode(sharedProject.code);
        setStdin(sharedProject.stdin);
        setCompiler(sharedProject.compiler);
        setStandard(sharedProject.options || "c++20");
        setCompilerSettings(sharedProject.settings || DEFAULT_COMPILER_SETTINGS);
        setProjectName(sharedProject.name);
        showNotification("Enlace compartido cargado ✓");
        return;
      }
    }

    const savedActiveId = getActiveProjectId();
    const active =
      loadedProjects.find((p) => p.id === savedActiveId) || loadedProjects[0];

    if (active) {
      setActiveId(active.id);
      setCode(active.code);
      setStdin(active.stdin);
      setCompiler(active.compiler);
      setStandard(active.options || "c++20");
      setCompilerSettings(active.settings || DEFAULT_COMPILER_SETTINGS);
      setProjectName(active.name);
    }
  }, []);

  // Save current project state
  const saveCurrentProject = useCallback(() => {
    if (!activeProjectId) return;

    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              code,
              stdin,
              compiler,
              options: standard,
              settings: compilerSettings,
              updatedAt: Date.now(),
            }
          : p
      );
      saveProjects(updated);
      return updated;
    });

    showNotification("Proyecto guardado ✓");
  }, [activeProjectId, code, stdin, compiler, standard, compilerSettings]);

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
  }, [code, stdin, compiler, standard, compilerSettings, saveCurrentProject, activeProjectId]);

  // Project selection
  const handleSelectProject = (id: string) => {
    saveCurrentProject();

    const target = projects.find((p) => p.id === id);
    if (target) {
      setActiveId(target.id);
      setActiveProjectId(target.id);
      setCode(target.code);
      setStdin(target.stdin);
      setCompiler(target.compiler);
      setStandard(target.options || "c++20");
      setCompilerSettings(target.settings || DEFAULT_COMPILER_SETTINGS);
      setProjectName(target.name);
      setOutput(null);
    }
  };

  // Create Project
  const handleCreateProject = () => {
    const newProj = createProject(`Proyecto ${projects.length + 1}`);
    const updated = [newProj, ...projects];
    setProjects(updated);
    saveProjects(updated);
    handleSelectProject(newProj.id);
  };

  // Delete Project
  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveProjects(updated);

    if (activeProjectId === id) {
      const next = updated[0];
      if (next) {
        handleSelectProject(next.id);
      }
    }
  };

  // Rename Project
  const handleRenameProject = (id: string, newName: string) => {
    const updated = projects.map((p) =>
      p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p
    );
    setProjects(updated);
    saveProjects(updated);
    if (activeProjectId === id) {
      setProjectName(newName);
    }
  };

  // Load Template safely as new project
  const handleSelectTemplate = (template: CodeTemplate) => {
    const newProj = createProject(
      template.title,
      template.code,
      template.standard,
      template.stdin || "",
      DEFAULT_COMPILER_SETTINGS
    );
    const updated = [newProj, ...projects];
    setProjects(updated);
    saveProjects(updated);
    handleSelectProject(newProj.id);
    showNotification(`Plantilla "${template.title}" cargada`);
  };

  // Code Formatter
  const handleFormatCode = () => {
    if (!code) return;
    const formatted = formatCppCode(code);
    setCode(formatted);
    showNotification("Código formateado ✓");
  };

  // Share via URL hash
  const handleShare = () => {
    const url = generateShareUrl({
      code,
      stdin,
      compiler,
      standard,
      settings: compilerSettings,
    });
    navigator.clipboard.writeText(url);
    showNotification("¡Enlace copiado al portapapeles!");
  };

  // Export Project Files as .cc
  const handleExport = () => {
    downloadCcFile(projectName, code);
    const makefile = generateMakefile(standard, compilerSettings);
    const cmake = generateCMakeLists(projectName, standard, compilerSettings);
    console.info("Generated Makefile:\n", makefile);
    console.info("Generated CMakeLists.txt:\n", cmake);
    const baseName = projectName.replace(/\.(cpp|cc|cxx|c\+\+|c|h|hpp)$/i, "");
    showNotification(`Descargado ${baseName}.cc ✓`);
  };

  // Run/Compile program
  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(null);

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        stderr: error.message || "No se pudo conectar con el servidor de compilación.",
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
        setIsSettingsOpen((prev) => !prev);
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
  }, [code, stdin, compiler, standard, compilerSettings, isRunning, saveCurrentProject]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#090a0f]">
      {/* Top Toolbar */}
      {!isZenMode && (
        <Toolbar
          onRun={handleRun}
          onSave={saveCurrentProject}
          isRunning={isRunning}
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
      <div className="flex flex-1 overflow-hidden relative">
        {/* Projects Sidebar */}
        {!isZenMode && (
          <ProjectSidebar
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Central Workspace (Editor + Bottom I/O Panels) */}
        <main
          id="main-content"
          className="flex-1 flex flex-col p-2 sm:p-3 gap-2 overflow-hidden relative"
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

          {/* Top Half: CodeMirror Editor */}
          <div className="flex-1 min-h-[45%] h-full">
            <Editor
              value={code}
              onChange={setCode}
              onRun={handleRun}
              readOnly={isRunning}
            />
          </div>

          {/* Bottom Half: Stdin & Output Panels */}
          <div className="h-[40%] min-h-[180px] grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Left 1 col: Stdin Input */}
            <div className="h-full">
              <StdinPanel
                value={stdin}
                onChange={setStdin}
                disabled={isRunning}
              />
            </div>

            {/* Right 2 cols: Output Panel */}
            <div className="md:col-span-2 h-full">
              <OutputPanel
                result={output}
                isRunning={isRunning}
                onClear={() => setOutput(null)}
              />
            </div>
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
