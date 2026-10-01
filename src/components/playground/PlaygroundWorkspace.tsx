"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
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
  CustomLayoutModal,
  DEFAULT_CUSTOM_LAYOUT,
} from "@/components/playground/CustomLayoutModal";
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
import {
  Project,
  CompileResponse,
  CompilerSettings,
  CodeTemplate,
  SupportedLanguage,
  PlaygroundLayout,
  CustomLayoutConfig,
  PanelId,
  AuthUser,
  CloudSyncState,
} from "@/types";
import {
  fetchAuthStatus,
  fetchCloudProjects,
  saveProjectToCloud,
  deleteProjectFromCloud,
  syncBatchProjectsToCloud,
} from "@/lib/cloud-projects";

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

  // User & Cloud Sync State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<CloudSyncState>("idle");

  // Layout mode & panel visibility
  const [layout, setLayout] = useState<PlaygroundLayout>("standard");
  const [showStdin, setShowStdin] = useState(true);

  // Custom layout modal & configuration
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customConfig, setCustomConfig] = useState<CustomLayoutConfig>(DEFAULT_CUSTOM_LAYOUT);
  const [maximizedPanel, setMaximizedPanel] = useState<PanelId | null>(null);

  // Resizing state & persistence
  const [sidebarWidth, setSidebarWidth] = useState(260);
  // Standard layout (editor height % + stdin width %)
  const [editorHeight, setEditorHeight] = useState(60);
  const [stdinWidth, setStdinWidth] = useState(30);
  // Two-column layout (editor width % + stdin height %)
  const [editorWidth, setEditorWidth] = useState(55);
  const [stdinHeight, setStdinHeight] = useState(35);
  // Columns layout (col1 width % + col2 width %)
  const [col1Width, setCol1Width] = useState(45);
  const [col2Width, setCol2Width] = useState(25);
  // Vertical layout (row1 height % + row2 height %)
  const [row1Height, setRow1Height] = useState(50);
  const [row2Height, setRow2Height] = useState(25);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedLayout = localStorage.getItem("cpp_playground_layout");
      if (savedLayout && ["standard", "two-column", "columns", "vertical", "custom"].includes(savedLayout)) {
        setLayout(savedLayout as PlaygroundLayout);
      }
      const savedCustom = localStorage.getItem("cpp_custom_layout");
      if (savedCustom) {
        try {
          setCustomConfig(JSON.parse(savedCustom));
        } catch {}
      }
      const savedStdin = localStorage.getItem("cpp_show_stdin");
      if (savedStdin !== null) {
        setShowStdin(savedStdin === "true");
      }
      const sw = localStorage.getItem("cpp_sidebar_width");
      if (sw) setSidebarWidth(Math.max(160, Math.min(500, Number(sw))));
      const eh = localStorage.getItem("cpp_editor_height");
      if (eh) setEditorHeight(Math.max(15, Math.min(85, Number(eh))));
      const siw = localStorage.getItem("cpp_stdin_width");
      if (siw) setStdinWidth(Math.max(15, Math.min(85, Number(siw))));
      const ew = localStorage.getItem("cpp_editor_width");
      if (ew) setEditorWidth(Math.max(20, Math.min(80, Number(ew))));
      const sih = localStorage.getItem("cpp_stdin_height");
      if (sih) setStdinHeight(Math.max(15, Math.min(85, Number(sih))));
      const c1 = localStorage.getItem("cpp_col1_width");
      if (c1) setCol1Width(Math.max(20, Math.min(65, Number(c1))));
      const c2 = localStorage.getItem("cpp_col2_width");
      if (c2) setCol2Width(Math.max(15, Math.min(50, Number(c2))));
      const r1 = localStorage.getItem("cpp_row1_height");
      if (r1) setRow1Height(Math.max(20, Math.min(65, Number(r1))));
      const r2 = localStorage.getItem("cpp_row2_height");
      if (r2) setRow2Height(Math.max(15, Math.min(50, Number(r2))));
    } catch {}
  }, []);

  const handleLayoutChange = (newLayout: PlaygroundLayout) => {
    setLayout(newLayout);
    try {
      localStorage.setItem("cpp_playground_layout", newLayout);
    } catch {}
    const labels: Record<PlaygroundLayout, string> = {
      standard: "Diseño Estándar",
      "two-column": "Diseño 2 Columnas",
      columns: "Diseño 3 Columnas",
      vertical: "Diseño Vertical",
      custom: "Diseño Personalizado",
    };
    showNotification(`${labels[newLayout]} activado ✓`);
  };

  const handleSaveCustomLayout = (newConfig: CustomLayoutConfig) => {
    setCustomConfig(newConfig);
    setLayout("custom");
    try {
      localStorage.setItem("cpp_custom_layout", JSON.stringify(newConfig));
      localStorage.setItem("cpp_playground_layout", "custom");
    } catch {}
    showNotification("Diseño personalizado configurado ✓");
  };

  const handleToggleStdin = () => {
    setShowStdin((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cpp_show_stdin", String(next));
      } catch {}
      showNotification(next ? "Panel Stdin visible" : "Panel Stdin oculto");
      return next;
    });
  };

  const handleResetSizes = () => {
    setEditorHeight(60);
    setStdinWidth(30);
    setEditorWidth(55);
    setStdinHeight(35);
    setCol1Width(45);
    setCol2Width(25);
    setRow1Height(50);
    setRow2Height(25);
    try {
      localStorage.removeItem("cpp_editor_height");
      localStorage.removeItem("cpp_stdin_width");
      localStorage.removeItem("cpp_editor_width");
      localStorage.removeItem("cpp_stdin_height");
      localStorage.removeItem("cpp_col1_width");
      localStorage.removeItem("cpp_col2_width");
      localStorage.removeItem("cpp_row1_height");
      localStorage.removeItem("cpp_row2_height");
    } catch {}
    showNotification("Proporciones restablecidas ✓");
  };

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

  // Sync with Cloud upon mounting or user change
  useEffect(() => {
    let mounted = true;
    fetchAuthStatus().then(async (status) => {
      if (!mounted) return;
      if (status.user) {
        setAuthUser(status.user);
        setSyncStatus("saving");
        const cloudProjs = await fetchCloudProjects();
        if (!mounted) return;

        if (cloudProjs.length > 0) {
          // Filter cloud projects for current language
          const cloudForLang = cloudProjs.filter((p) => (p.language || "cpp") === language);
          if (cloudForLang.length > 0) {
            setProjects((prevLocal) => {
              const cloudIds = new Set(cloudForLang.map((p) => p.id));
              const merged = [...cloudForLang, ...prevLocal.filter((p) => !cloudIds.has(p.id))];
              saveLanguageProjects(language, merged);
              return merged;
            });
          }
          setSyncStatus("synced");
        } else {
          // Cloud has no projects yet; backup existing local projects to cloud
          const localProjs = getProjectsByLanguage(language);
          if (localProjs.length > 0) {
            const synced = await syncBatchProjectsToCloud(localProjs);
            if (!mounted) return;
            if (synced && synced.length > 0) {
              setSyncStatus("synced");
            } else {
              setSyncStatus("error");
            }
          } else {
            setSyncStatus("idle");
          }
        }
      } else {
        setSyncStatus("offline");
      }
    });

    return () => {
      mounted = false;
    };
  }, [language]);

  // Save current project state for current language
  const saveCurrentProject = useCallback(() => {
    if (!activeProjectId) return;

    let targetProject: Project | null = null;

    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === activeProjectId) {
          const upd: Project = {
            ...p,
            language,
            code,
            stdin,
            compiler,
            options: standard,
            settings: compilerSettings,
            updatedAt: Date.now(),
          };
          targetProject = upd;
          return upd;
        }
        return p;
      });
      saveLanguageProjects(language, updated);
      return updated;
    });

    if (!authUser) {
      showNotification("Guardado localmente ✓");
    }

    // Push to Cloud (MongoDB + R2) if logged in
    if (authUser && targetProject) {
      setSyncStatus("saving");
      saveProjectToCloud(targetProject)
        .then((saved) => {
          if (saved) {
            setSyncStatus("synced");
            showNotification("Sincronizado en la nube ✓");
            setProjects((prev) =>
              prev.map((p) =>
                p.id === activeProjectId
                  ? { ...p, isCloud: true, syncedAt: Date.now() }
                  : p
              )
            );
          } else {
            setSyncStatus("error");
            showNotification("Error de sincronización (guardado local)");
          }
        })
        .catch(() => {
          setSyncStatus("error");
          showNotification("Error de sincronización (guardado local)");
        });
    }
  }, [activeProjectId, language, code, stdin, compiler, standard, compilerSettings, authUser]);

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

    if (authUser) {
      deleteProjectFromCloud(id).catch((err) =>
        console.error("Error al borrar en la nube:", err)
      );
    }

    if (activeProjectId === id) {
      if (updated.length > 0) {
        handleSelectProject(updated[0].id);
      } else {
        // If deleted last project, generate a new clean project
        handleCreateProject();
      }
    }
  };

  // Manual Cloud Sync
  const handleManualSync = async () => {
    if (!authUser) {
      window.location.href = "/api/auth/github/login";
      return;
    }
    setSyncStatus("saving");
    try {
      const synced = await syncBatchProjectsToCloud(projects);
      if (synced && synced.length > 0) {
        setProjects(synced);
        saveLanguageProjects(language, synced);
        setSyncStatus("synced");
        showNotification("Proyectos sincronizados en la nube ✓");
      } else {
        setSyncStatus("synced");
        showNotification("Sincronización al día ✓");
      }
    } catch {
      setSyncStatus("error");
      showNotification("Error al sincronizar con la nube");
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
        setMaximizedPanel((prev) => (prev ? null : prev));
        setIsSettingsOpen(false);
        setIsTemplatesOpen(false);
        setIsShortcutsOpen(false);
        setIsCustomModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, stdin, compiler, standard, compilerSettings, isRunning, saveCurrentProject, language]);

  const langDef = getLanguage(language);
  const isWebPreview = Boolean(langDef.isWebPreview || language === "html");
  const effectiveShowStdin = !isWebPreview && showStdin;

  const editorPanel = (
    <div className="relative w-full h-full min-h-0 min-w-0 group/editor">
      <Editor
        value={code}
        onChange={setCode}
        onRun={handleRun}
        language={language}
        readOnly={isRunning}
      />
      <button
        type="button"
        onClick={() => setMaximizedPanel(maximizedPanel === "editor" ? null : "editor")}
        className="absolute top-2 right-2 z-20 opacity-0 group-hover/editor:opacity-100 transition-opacity p-1 bg-zinc-900/90 border border-zinc-700/80 rounded text-zinc-400 hover:text-neon-green shadow-md"
        title={maximizedPanel === "editor" ? "Restaurar editor (Esc)" : "Maximizar editor"}
        aria-label={maximizedPanel === "editor" ? "Restaurar editor" : "Maximizar editor"}
      >
        {maximizedPanel === "editor" ? (
          <Minimize2 className="w-3.5 h-3.5 text-neon-green" />
        ) : (
          <Maximize2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );

  const stdinPanel = (
    <StdinPanel
      value={stdin}
      onChange={setStdin}
      disabled={isRunning}
      onMaximize={() => setMaximizedPanel(maximizedPanel === "stdin" ? null : "stdin")}
      isMaximized={maximizedPanel === "stdin"}
    />
  );

  const outputPanel = (
    <OutputPanel
      result={output}
      isRunning={isRunning}
      onClear={() => setOutput(null)}
      language={language}
      code={code}
      onMaximize={() => setMaximizedPanel(maximizedPanel === "output" ? null : "output")}
      isMaximized={maximizedPanel === "output"}
    />
  );

  const renderPanel = (pid: PanelId) => {
    if (pid === "editor") return editorPanel;
    if (pid === "stdin") return stdinPanel;
    if (pid === "output") return outputPanel;
    return null;
  };

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
          layout={layout}
          onLayoutChange={handleLayoutChange}
          showStdin={showStdin}
          onToggleStdin={handleToggleStdin}
          onResetSizes={handleResetSizes}
          onOpenCustomModal={() => setIsCustomModalOpen(true)}
          syncStatus={syncStatus}
          onManualSync={handleManualSync}
          authUser={authUser}
          onUserChange={setAuthUser}
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
              isLoggedIn={Boolean(authUser)}
              onSyncAllToCloud={handleManualSync}
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

        {/* Central Workspace */}
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

          {/* Maximized Panel Overlay */}
          {maximizedPanel && (
            <div className="w-full h-full relative overflow-hidden">
              <div className="absolute top-2 right-4 z-40 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-zinc-900/90 border border-zinc-700 text-neon-green text-[10px] font-mono rounded shadow-lg">
                  Panel {maximizedPanel === "editor" ? "Editor" : maximizedPanel === "stdin" ? "Entrada" : "Salida"} al 100%
                </span>
                <button
                  type="button"
                  onClick={() => setMaximizedPanel(null)}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 text-[10px] font-mono shadow-lg flex items-center gap-1"
                >
                  <Minimize2 className="w-3 h-3" />
                  <span>Restaurar (Esc)</span>
                </button>
              </div>
              <div className="w-full h-full min-h-0 min-w-0">
                {renderPanel(maximizedPanel)}
              </div>
            </div>
          )}

          {!maximizedPanel && (
            <>
              {/* 1. Standard Layout: Editor Top, Stdin & Output Bottom */}
          {layout === "standard" && (
            <div className="w-full h-full flex flex-col overflow-hidden">
              <div
                style={{ height: `calc(${editorHeight}% - 4px)` }}
                className="w-full min-h-0 overflow-hidden"
              >
                {editorPanel}
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

              {/* Bottom Panels */}
              <div
                ref={bottomRef}
                style={{ height: `calc(${100 - editorHeight}% - 4px)` }}
                className="w-full min-h-0 flex flex-row overflow-hidden"
              >
                {effectiveShowStdin ? (
                  <>
                    <div
                      style={{ width: `calc(${stdinWidth}% - 4px)` }}
                      className="h-full min-w-0 overflow-hidden"
                    >
                      {stdinPanel}
                    </div>

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

                    <div
                      style={{ width: `calc(${100 - stdinWidth}% - 4px)` }}
                      className="h-full min-w-0 overflow-hidden flex-1"
                    >
                      {outputPanel}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full min-w-0 overflow-hidden">
                    {outputPanel}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Two-Column Layout: Editor Left, Stdin & Output Stacked Right */}
          {layout === "two-column" && (
            <div className="w-full h-full flex flex-row overflow-hidden">
              <div
                style={{ width: `calc(${editorWidth}% - 4px)` }}
                className="h-full min-w-0 overflow-hidden"
              >
                {editorPanel}
              </div>

              {/* Vertical Resizer between Editor and Right Column */}
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Redimensionar editor y consola"
                className="w-2 hover:w-2 relative z-10 cursor-col-resize group shrink-0 flex items-center justify-center touch-none select-none -mx-0.5"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                  const main = mainRef.current;
                  if (!main) return;
                  const rect = main.getBoundingClientRect();
                  if (rect.width <= 0) return;
                  const percent = Math.max(20, Math.min(80, ((e.clientX - rect.left) / rect.width) * 100));
                  setEditorWidth(percent);
                  try {
                    localStorage.setItem("cpp_editor_width", String(percent));
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

              {/* Right Column */}
              <div
                ref={rightRef}
                style={{ width: `calc(${100 - editorWidth}% - 4px)` }}
                className="h-full min-w-0 flex flex-col overflow-hidden"
              >
                {effectiveShowStdin ? (
                  <>
                    <div
                      style={{ height: `calc(${stdinHeight}% - 4px)` }}
                      className="w-full min-h-0 overflow-hidden"
                    >
                      {stdinPanel}
                    </div>

                    <div
                      role="separator"
                      aria-orientation="horizontal"
                      aria-label="Redimensionar entrada y salida"
                      className="h-2 hover:h-2 relative z-10 cursor-row-resize group shrink-0 flex items-center justify-center touch-none select-none -my-0.5"
                      onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerMove={(e) => {
                        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                        const right = rightRef.current;
                        if (!right) return;
                        const rect = right.getBoundingClientRect();
                        if (rect.height <= 0) return;
                        const percent = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
                        setStdinHeight(percent);
                        try {
                          localStorage.setItem("cpp_stdin_height", String(percent));
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

                    <div
                      style={{ height: `calc(${100 - stdinHeight}% - 4px)` }}
                      className="w-full min-h-0 overflow-hidden flex-1"
                    >
                      {outputPanel}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full min-w-0 overflow-hidden">
                    {outputPanel}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Columns Layout: Editor, Stdin & Output Side-by-Side in Columns */}
          {layout === "columns" && (
            <div className="w-full h-full flex flex-row overflow-hidden">
              <div
                style={{ width: `calc(${col1Width}% - 4px)` }}
                className="h-full min-w-0 overflow-hidden"
              >
                {editorPanel}
              </div>

              {/* Resizer 1: after Editor */}
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Redimensionar editor"
                className="w-2 hover:w-2 relative z-10 cursor-col-resize group shrink-0 flex items-center justify-center touch-none select-none -mx-0.5"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                  const main = mainRef.current;
                  if (!main) return;
                  const rect = main.getBoundingClientRect();
                  if (rect.width <= 0) return;
                  const maxLimit = effectiveShowStdin ? 60 : 80;
                  const percent = Math.max(20, Math.min(maxLimit, ((e.clientX - rect.left) / rect.width) * 100));
                  setCol1Width(percent);
                  try {
                    localStorage.setItem("cpp_col1_width", String(percent));
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

              {effectiveShowStdin ? (
                <>
                  <div
                    style={{ width: `calc(${col2Width}% - 4px)` }}
                    className="h-full min-w-0 overflow-hidden"
                  >
                    {stdinPanel}
                  </div>

                  {/* Resizer 2: between Stdin and Output */}
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
                      const main = mainRef.current;
                      if (!main) return;
                      const rect = main.getBoundingClientRect();
                      if (rect.width <= 0) return;
                      const currentTotal = ((e.clientX - rect.left) / rect.width) * 100;
                      const newCol2 = Math.max(15, Math.min(45, currentTotal - col1Width));
                      setCol2Width(newCol2);
                      try {
                        localStorage.setItem("cpp_col2_width", String(newCol2));
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

                  <div
                    style={{ width: `calc(${100 - col1Width - col2Width}% - 4px)` }}
                    className="h-full min-w-0 overflow-hidden flex-1"
                  >
                    {outputPanel}
                  </div>
                </>
              ) : (
                <div
                  style={{ width: `calc(${100 - col1Width}% - 4px)` }}
                  className="h-full min-w-0 overflow-hidden flex-1"
                >
                  {outputPanel}
                </div>
              )}
            </div>
          )}

          {/* 4. Vertical Layout: Editor, Stdin & Output Stacked in Rows */}
          {layout === "vertical" && (
            <div className="w-full h-full flex flex-col overflow-hidden">
              <div
                style={{ height: `calc(${row1Height}% - 4px)` }}
                className="w-full min-h-0 overflow-hidden"
              >
                {editorPanel}
              </div>

              {/* Resizer 1: after Editor */}
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="Redimensionar editor"
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
                  const maxLimit = effectiveShowStdin ? 60 : 80;
                  const percent = Math.max(20, Math.min(maxLimit, ((e.clientY - rect.top) / rect.height) * 100));
                  setRow1Height(percent);
                  try {
                    localStorage.setItem("cpp_row1_height", String(percent));
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

              {effectiveShowStdin ? (
                <>
                  <div
                    style={{ height: `calc(${row2Height}% - 4px)` }}
                    className="w-full min-h-0 overflow-hidden"
                  >
                    {stdinPanel}
                  </div>

                  {/* Resizer 2: between Stdin and Output */}
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="Redimensionar entrada y salida"
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
                      const currentTotal = ((e.clientY - rect.top) / rect.height) * 100;
                      const newRow2 = Math.max(15, Math.min(45, currentTotal - row1Height));
                      setRow2Height(newRow2);
                      try {
                        localStorage.setItem("cpp_row2_height", String(newRow2));
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

                  <div
                    style={{ height: `calc(${100 - row1Height - row2Height}% - 4px)` }}
                    className="w-full min-h-0 overflow-hidden flex-1"
                  >
                    {outputPanel}
                  </div>
                </>
              ) : (
                <div
                  style={{ height: `calc(${100 - row1Height}% - 4px)` }}
                  className="w-full min-h-0 overflow-hidden flex-1"
                >
                  {outputPanel}
                </div>
              )}
            </div>
          )}

          {/* 5. Custom Layout: Split */}
          {layout === "custom" && customConfig.type === "split" && (() => {
            const primaryId = customConfig.primaryPanel;
            const isPrimaryHidden =
              customConfig.hiddenPanels.includes(primaryId) ||
              (isWebPreview && primaryId === "stdin");
            const secondaryPanels = (customConfig.secondaryOrder || ["stdin", "output"]).filter(
              (p) =>
                p !== primaryId &&
                !customConfig.hiddenPanels.includes(p) &&
                !(isWebPreview && p === "stdin")
            );

            const isOuterRow = customConfig.direction === "row";
            const primaryPercent = customConfig.splitPrimaryPercent ?? 55;
            const secondaryPercent = customConfig.splitSecondaryPercent ?? 45;

            const primaryElement = !isPrimaryHidden && (
              <div
                style={
                  isOuterRow
                    ? { width: secondaryPanels.length === 0 ? "100%" : `calc(${primaryPercent}% - 4px)` }
                    : { height: secondaryPanels.length === 0 ? "100%" : `calc(${primaryPercent}% - 4px)` }
                }
                className="w-full h-full min-h-0 min-w-0 overflow-hidden"
              >
                {renderPanel(primaryId)}
              </div>
            );

            const primaryResizer = secondaryPanels.length > 0 && !isPrimaryHidden && (
              <div
                role="separator"
                aria-orientation={isOuterRow ? "vertical" : "horizontal"}
                aria-label="Redimensionar panel principal"
                className={`${
                  isOuterRow
                    ? "w-2 hover:w-2 cursor-col-resize -mx-0.5"
                    : "h-2 hover:h-2 cursor-row-resize -my-0.5"
                } relative z-10 group shrink-0 flex items-center justify-center touch-none select-none`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                  const main = mainRef.current;
                  if (!main) return;
                  const rect = main.getBoundingClientRect();
                  const dim = isOuterRow ? rect.width : rect.height;
                  if (dim <= 0) return;
                  const clientPos = isOuterRow ? e.clientX - rect.left : e.clientY - rect.top;
                  const rawPercent = (clientPos / dim) * 100;
                  const effectivePercent =
                    customConfig.primaryPosition === "end" ? 100 - rawPercent : rawPercent;
                  const clamped = Math.max(15, Math.min(85, effectivePercent));
                  setCustomConfig((prev) => {
                    const updated = { ...prev, splitPrimaryPercent: clamped };
                    try {
                      localStorage.setItem("cpp_custom_layout", JSON.stringify(updated));
                    } catch {}
                    return updated;
                  });
                }}
                onPointerUp={(e) => {
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                }}
              >
                <div
                  className={`${
                    isOuterRow ? "w-[2px] h-full" : "h-[2px] w-full"
                  } bg-zinc-800/80 group-hover:bg-neon-green group-active:bg-neon-green transition-colors`}
                />
              </div>
            );

            const isSecRow = customConfig.secondaryDirection === "row";

            const secondaryContainer = secondaryPanels.length > 0 && (
              <div
                style={
                  isPrimaryHidden
                    ? { width: "100%", height: "100%" }
                    : isOuterRow
                    ? { width: `calc(${100 - primaryPercent}% - 4px)` }
                    : { height: `calc(${100 - primaryPercent}% - 4px)` }
                }
                className={`min-h-0 min-w-0 flex overflow-hidden ${
                  isSecRow ? "flex-row" : "flex-col"
                } ${isPrimaryHidden ? "w-full h-full" : "flex-1"}`}
              >
                {secondaryPanels.length === 1 && (
                  <div className="w-full h-full min-h-0 min-w-0 overflow-hidden">
                    {renderPanel(secondaryPanels[0])}
                  </div>
                )}

                {secondaryPanels.length === 2 && (
                  <>
                    <div
                      style={
                        isSecRow
                          ? { width: `calc(${secondaryPercent}% - 4px)` }
                          : { height: `calc(${secondaryPercent}% - 4px)` }
                      }
                      className="w-full h-full min-h-0 min-w-0 overflow-hidden"
                    >
                      {renderPanel(secondaryPanels[0])}
                    </div>

                    <div
                      role="separator"
                      aria-orientation={isSecRow ? "vertical" : "horizontal"}
                      aria-label="Redimensionar paneles secundarios"
                      className={`${
                        isSecRow
                          ? "w-2 hover:w-2 cursor-col-resize -mx-0.5"
                          : "h-2 hover:h-2 cursor-row-resize -my-0.5"
                      } relative z-10 group shrink-0 flex items-center justify-center touch-none select-none`}
                      onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerMove={(e) => {
                        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                        const target = e.currentTarget.parentElement;
                        if (!target) return;
                        const rect = target.getBoundingClientRect();
                        const dim = isSecRow ? rect.width : rect.height;
                        if (dim <= 0) return;
                        const clientPos = isSecRow ? e.clientX - rect.left : e.clientY - rect.top;
                        const clamped = Math.max(15, Math.min(85, (clientPos / dim) * 100));
                        setCustomConfig((prev) => {
                          const updated = { ...prev, splitSecondaryPercent: clamped };
                          try {
                            localStorage.setItem("cpp_custom_layout", JSON.stringify(updated));
                          } catch {}
                          return updated;
                        });
                      }}
                      onPointerUp={(e) => {
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch {}
                      }}
                    >
                      <div
                        className={`${
                          isSecRow ? "w-[2px] h-full" : "h-[2px] w-full"
                        } bg-zinc-800/80 group-hover:bg-neon-green group-active:bg-neon-green transition-colors`}
                      />
                    </div>

                    <div
                      style={
                        isSecRow
                          ? { width: `calc(${100 - secondaryPercent}% - 4px)` }
                          : { height: `calc(${100 - secondaryPercent}% - 4px)` }
                      }
                      className="w-full h-full min-h-0 min-w-0 overflow-hidden flex-1"
                    >
                      {renderPanel(secondaryPanels[1])}
                    </div>
                  </>
                )}
              </div>
            );

            if (isPrimaryHidden && secondaryPanels.length === 0) {
              return (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-xs gap-2">
                  <p>Todos los paneles están ocultos en este layout.</p>
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(true)}
                    className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-neon-green border border-zinc-700 text-xs"
                  >
                    Abrir configuración de layout
                  </button>
                </div>
              );
            }

            return (
              <div
                className={`w-full h-full flex overflow-hidden ${
                  isOuterRow ? "flex-row" : "flex-col"
                }`}
              >
                {isPrimaryHidden ? (
                  secondaryContainer
                ) : customConfig.primaryPosition === "start" ? (
                  <>
                    {primaryElement}
                    {primaryResizer}
                    {secondaryContainer}
                  </>
                ) : (
                  <>
                    {secondaryContainer}
                    {primaryResizer}
                    {primaryElement}
                  </>
                )}
              </div>
            );
          })()}

          {/* 6. Custom Layout: Linear */}
          {layout === "custom" && customConfig.type === "linear" && (() => {
            const visiblePanels = customConfig.order.filter(
              (p) =>
                !customConfig.hiddenPanels.includes(p) &&
                !(isWebPreview && p === "stdin")
            );
            const isRow = customConfig.direction === "row";

            if (visiblePanels.length === 0) {
              return (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-xs gap-2">
                  <p>Todos los paneles están ocultos en este layout.</p>
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(true)}
                    className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-neon-green border border-zinc-700 text-xs"
                  >
                    Abrir configuración de layout
                  </button>
                </div>
              );
            }

            if (visiblePanels.length === 1) {
              return (
                <div className="w-full h-full min-h-0 min-w-0 overflow-hidden">
                  {renderPanel(visiblePanels[0])}
                </div>
              );
            }

            if (visiblePanels.length === 2) {
              const p1Percent = customConfig.splitPrimaryPercent ?? 50;
              return (
                <div className={`w-full h-full flex overflow-hidden ${isRow ? "flex-row" : "flex-col"}`}>
                  <div
                    style={isRow ? { width: `calc(${p1Percent}% - 4px)` } : { height: `calc(${p1Percent}% - 4px)` }}
                    className="w-full h-full min-h-0 min-w-0 overflow-hidden"
                  >
                    {renderPanel(visiblePanels[0])}
                  </div>

                  <div
                    role="separator"
                    aria-orientation={isRow ? "vertical" : "horizontal"}
                    aria-label="Redimensionar paneles"
                    className={`${
                      isRow ? "w-2 hover:w-2 cursor-col-resize -mx-0.5" : "h-2 hover:h-2 cursor-row-resize -my-0.5"
                    } relative z-10 group shrink-0 flex items-center justify-center touch-none select-none`}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                      const main = mainRef.current;
                      if (!main) return;
                      const rect = main.getBoundingClientRect();
                      const dim = isRow ? rect.width : rect.height;
                      if (dim <= 0) return;
                      const clientPos = isRow ? e.clientX - rect.left : e.clientY - rect.top;
                      const clamped = Math.max(15, Math.min(85, (clientPos / dim) * 100));
                      setCustomConfig((prev) => {
                        const updated = { ...prev, splitPrimaryPercent: clamped };
                        try {
                          localStorage.setItem("cpp_custom_layout", JSON.stringify(updated));
                        } catch {}
                        return updated;
                      });
                    }}
                    onPointerUp={(e) => {
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      } catch {}
                    }}
                  >
                    <div
                      className={`${
                        isRow ? "w-[2px] h-full" : "h-[2px] w-full"
                      } bg-zinc-800/80 group-hover:bg-neon-green group-active:bg-neon-green transition-colors`}
                    />
                  </div>

                  <div
                    style={isRow ? { width: `calc(${100 - p1Percent}% - 4px)` } : { height: `calc(${100 - p1Percent}% - 4px)` }}
                    className="w-full h-full min-h-0 min-w-0 overflow-hidden flex-1"
                  >
                    {renderPanel(visiblePanels[1])}
                  </div>
                </div>
              );
            }

            const p1 = customConfig.linearPercents?.[0] ?? 35;
            const p2 = customConfig.linearPercents?.[1] ?? 30;

            return (
              <div className={`w-full h-full flex overflow-hidden ${isRow ? "flex-row" : "flex-col"}`}>
                <div
                  style={isRow ? { width: `calc(${p1}% - 4px)` } : { height: `calc(${p1}% - 4px)` }}
                  className="w-full h-full min-h-0 min-w-0 overflow-hidden"
                >
                  {renderPanel(visiblePanels[0])}
                </div>

                <div
                  role="separator"
                  aria-orientation={isRow ? "vertical" : "horizontal"}
                  aria-label="Redimensionar panel 1"
                  className={`${
                    isRow ? "w-2 hover:w-2 cursor-col-resize -mx-0.5" : "h-2 hover:h-2 cursor-row-resize -my-0.5"
                  } relative z-10 group shrink-0 flex items-center justify-center touch-none select-none`}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                    const main = mainRef.current;
                    if (!main) return;
                    const rect = main.getBoundingClientRect();
                    const dim = isRow ? rect.width : rect.height;
                    if (dim <= 0) return;
                    const clientPos = isRow ? e.clientX - rect.left : e.clientY - rect.top;
                    const clamped = Math.max(15, Math.min(60, (clientPos / dim) * 100));
                    setCustomConfig((prev) => {
                      const updated = {
                        ...prev,
                        linearPercents: [clamped, prev.linearPercents?.[1] ?? 30, 0],
                      };
                      try {
                        localStorage.setItem("cpp_custom_layout", JSON.stringify(updated));
                      } catch {}
                      return updated;
                    });
                  }}
                  onPointerUp={(e) => {
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                  }}
                >
                  <div
                    className={`${
                      isRow ? "w-[2px] h-full" : "h-[2px] w-full"
                    } bg-zinc-800/80 group-hover:bg-neon-green group-active:bg-neon-green transition-colors`}
                  />
                </div>

                <div
                  style={isRow ? { width: `calc(${p2}% - 4px)` } : { height: `calc(${p2}% - 4px)` }}
                  className="w-full h-full min-h-0 min-w-0 overflow-hidden"
                >
                  {renderPanel(visiblePanels[1])}
                </div>

                <div
                  role="separator"
                  aria-orientation={isRow ? "vertical" : "horizontal"}
                  aria-label="Redimensionar panel 2"
                  className={`${
                    isRow ? "w-2 hover:w-2 cursor-col-resize -mx-0.5" : "h-2 hover:h-2 cursor-row-resize -my-0.5"
                  } relative z-10 group shrink-0 flex items-center justify-center touch-none select-none`}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                    const main = mainRef.current;
                    if (!main) return;
                    const rect = main.getBoundingClientRect();
                    const dim = isRow ? rect.width : rect.height;
                    if (dim <= 0) return;
                    const clientPos = isRow ? e.clientX - rect.left : e.clientY - rect.top;
                    const totalPos = (clientPos / dim) * 100;
                    const clamped = Math.max(15, Math.min(50, totalPos - p1));
                    setCustomConfig((prev) => {
                      const updated = {
                        ...prev,
                        linearPercents: [p1, clamped, 0],
                      };
                      try {
                        localStorage.setItem("cpp_custom_layout", JSON.stringify(updated));
                      } catch {}
                      return updated;
                    });
                  }}
                  onPointerUp={(e) => {
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                  }}
                >
                  <div
                    className={`${
                      isRow ? "w-[2px] h-full" : "h-[2px] w-full"
                    } bg-zinc-800/80 group-hover:bg-neon-green group-active:bg-neon-green transition-colors`}
                  />
                </div>

                <div
                  style={isRow ? { width: `calc(${100 - p1 - p2}% - 4px)` } : { height: `calc(${100 - p1 - p2}% - 4px)` }}
                  className="w-full h-full min-h-0 min-w-0 overflow-hidden flex-1"
                >
                  {renderPanel(visiblePanels[2])}
                </div>
              </div>
            );
          })()}
        </>
      )}
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

      <CustomLayoutModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        config={customConfig}
        onSave={handleSaveCustomLayout}
        isHtml={isWebPreview}
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
