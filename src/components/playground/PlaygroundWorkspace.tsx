"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, FileCode, Plus, BookOpen } from "lucide-react";
import { Toolbar } from "@/components/playground/Toolbar";
import { Editor } from "@/components/playground/Editor";
import { StdinPanel } from "@/components/playground/StdinPanel";
import { OutputPanel } from "@/components/playground/OutputPanel";
import { InteractiveTerminal } from "@/components/playground/InteractiveTerminal";
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
import { ShareModal } from "@/components/playground/ShareModal";
import {
  getProjectsByLanguage,
  saveLanguageProjects,
  getActiveProjectId,
  setActiveProjectId,
  createProject,
  getRawLocalProjects,
  clearAllLocalStorage,
} from "@/lib/projects";
import { generateShareUrl, decodeShareableState, ShareableState } from "@/lib/share";
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
  ConsoleMode,
} from "@/types";
import {
  fetchAuthStatus,
  fetchCloudProjects,
  saveProjectToCloud,
  deleteProjectFromCloud,
  pushProjectsToCloud,
  pullProjectsFromCloud,
  syncBidirectional,
} from "@/lib/cloud-projects";

export interface PlaygroundWorkspaceProps {
  initialLanguage?: SupportedLanguage;
  initialProjectId?: string;
  initialSharedState?: ShareableState;
}

export function PlaygroundWorkspace({
  initialLanguage = "cpp",
  initialProjectId,
  initialSharedState,
}: PlaygroundWorkspaceProps) {
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
  const [consoleMode, setConsoleMode] = useState<ConsoleMode>("split");
  const [interactiveRunTrigger, setInteractiveRunTrigger] = useState(0);

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
      const savedConsole = localStorage.getItem("playground_console_mode");
      if (savedConsole === "interactive" || savedConsole === "split") {
        setConsoleMode(savedConsole as ConsoleMode);
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

  const handleToggleConsoleMode = () => {
    setConsoleMode((prev) => {
      const next: ConsoleMode = prev === "interactive" ? "split" : "interactive";
      try {
        localStorage.setItem("playground_console_mode", next);
      } catch {}
      showNotification(
        next === "interactive"
          ? "Consola Normal activada (inputs interactivos uno a uno) ✓"
          : "Modo Dividido activado (stdin por lote) ✓"
      );
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

  // Load projects & Auth sync initialization
  useEffect(() => {
    let mounted = true;
    const currentLang = initialLanguage;
    setLanguage(currentLang);

    async function initWorkspace() {
      // 1. Shared state check (prop or URL hash)
      const sharedFromHash =
        typeof window !== "undefined" && window.location.hash
          ? decodeShareableState(window.location.hash)
          : null;
      const shared = initialSharedState || sharedFromHash;
      if (shared) {
        const sharedLang: SupportedLanguage = shared.language || currentLang;
        if (sharedLang !== currentLang && !initialSharedState) {
          router.push(`/${sharedLang}/playground${window.location.hash}`);
          return;
        }

        const langDef = getLanguage(sharedLang);
        const sharedProject = createProject(
          shared.title || "Código Compartido",
          shared.code,
          shared.standard || langDef.defaultStandard,
          shared.stdin || "",
          shared.settings || DEFAULT_COMPILER_SETTINGS,
          sharedLang
        );
        if (shared.compiler) sharedProject.compiler = shared.compiler;

          const authStatus = await fetchAuthStatus();
          if (!mounted) return;

          if (authStatus.user) {
            setAuthUser(authStatus.user);
            setSyncStatus("saving");
            const saved = await saveProjectToCloud(sharedProject);
            const cloudProjs = await fetchCloudProjects();
            const filtered = cloudProjs.filter((p) => (p.language || "cpp") === sharedLang);
            const merged = saved ? [saved, ...filtered.filter((p) => p.id !== saved.id)] : filtered;
            setProjects(merged);
            setActiveId(sharedProject.id);
            setCode(sharedProject.code);
            setStdin(sharedProject.stdin);
            setCompiler(sharedProject.compiler);
            setStandard(sharedProject.options || langDef.defaultStandard);
            setCompilerSettings(sharedProject.settings || DEFAULT_COMPILER_SETTINGS);
            setProjectName(sharedProject.name);
            setSyncStatus("synced");
            showNotification("Enlace compartido guardado en la nube ✓");
            return;
          } else {
            setAuthUser(null);
            setSyncStatus("offline");
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

      // 2. Regular initialization: check auth
      const authStatus = await fetchAuthStatus();
      if (!mounted) return;

      if (authStatus.user) {
        setAuthUser(authStatus.user);
        setSyncStatus("saving");

        // Migrate local projects if any exist
        const localProjects = getRawLocalProjects();
        if (localProjects.length > 0) {
          await pushProjectsToCloud(localProjects);
        }
        // Wipe all local storage for logged-in user
        clearAllLocalStorage();

        // Fetch cloud projects
        const cloudProjs = await fetchCloudProjects();
        if (!mounted) return;

        const langProjects = cloudProjs.filter((p) => (p.language || "cpp") === currentLang);

        setProjects(langProjects);
        const active =
          (initialProjectId ? langProjects.find((p) => p.id === initialProjectId) : undefined) ||
          langProjects[0];
        if (active) {
          const langDef = getLanguage(currentLang);
          setActiveId(active.id);
          setCode(active.code);
          setStdin(active.stdin);
          setCompiler(active.compiler || langDef.defaultCompiler);
          setStandard(active.options || langDef.defaultStandard);
          setCompilerSettings(active.settings || DEFAULT_COMPILER_SETTINGS);
          setProjectName(active.name);
        } else {
          setActiveId(null);
          setCode("");
          setStdin("");
          setProjectName("Sin proyectos");
          setOutput(null);
        }
        setSyncStatus("synced");
        if (localProjects.length > 0) {
          showNotification("Proyectos locales migrados a la nube y almacenamiento local eliminado ✓");
        }
      } else {
        setAuthUser(null);
        setSyncStatus("offline");
        const langProjects = getProjectsByLanguage(currentLang);
        setProjects(langProjects);

        const savedActiveId = initialProjectId || getActiveProjectId(currentLang);
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
        } else {
          setActiveId(null);
          setActiveProjectId(null, currentLang);
          setCode("");
          setStdin("");
          setProjectName("Sin proyectos");
          setOutput(null);
        }
      }
    }

    initWorkspace();

    return () => {
      mounted = false;
    };
  }, [initialLanguage, initialProjectId, initialSharedState, router]);

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

      if (!authUser) {
        saveLanguageProjects(language, updated);
      }
      return updated;
    });

    if (!authUser) {
      showNotification("Guardado localmente ✓");
      return;
    }

    // Push to Cloud (MongoDB + R2) if logged in - no localStorage
    if (authUser && targetProject) {
      setSyncStatus("saving");
      saveProjectToCloud(targetProject)
        .then((saved) => {
          if (saved) {
            setSyncStatus("synced");
            setProjects((prev) =>
              prev.map((p) =>
                p.id === activeProjectId
                  ? { ...p, isCloud: true, syncedAt: Date.now() }
                  : p
              )
            );
          } else {
            setSyncStatus("error");
            showNotification("Error al guardar en la nube");
          }
        })
        .catch(() => {
          setSyncStatus("error");
          showNotification("Error al guardar en la nube");
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
  const handleSelectProject = (id: string, projectList?: Project[]) => {
    saveCurrentProject();

    const target = (projectList || projects).find((p) => p.id === id);
    if (target) {
      setActiveId(target.id);
      if (!authUser) {
        setActiveProjectId(target.id, language);
      }
      setCode(target.code);
      setStdin(target.stdin);
      setCompiler(target.compiler);
      setStandard(target.options || getLanguage(language).defaultStandard);
      setCompilerSettings(target.settings || DEFAULT_COMPILER_SETTINGS);
      setProjectName(target.name);
      setOutput(null);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/${language}/playground/${target.id}`);
      }
    }
  };

  // Language change from toolbar -> navigates to /[language]/playground
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    if (newLang === language) return;
    saveCurrentProject();
    router.push(`/${newLang}/playground`);
  };

  // Create Project in current language (optional folder)
  const handleCreateProject = async (folder?: string) => {
    saveCurrentProject();

    const langDef = getLanguage(language);
    const newProj = createProject(
      `Proyecto ${langDef.name} ${projects.length + 1}`,
      "",
      langDef.defaultStandard,
      "",
      DEFAULT_COMPILER_SETTINGS,
      language,
      folder
    );

    setActiveId(newProj.id);
    if (!authUser) {
      setActiveProjectId(newProj.id, language);
    }
    setCode("");
    setStdin("");
    setCompiler(newProj.compiler);
    setStandard(newProj.options || langDef.defaultStandard);
    setCompilerSettings(DEFAULT_COMPILER_SETTINGS);
    setProjectName(newProj.name);
    setOutput(null);

    if (authUser) {
      setSyncStatus("saving");
      const saved = await saveProjectToCloud(newProj);
      const finalProj = saved || newProj;
      const updated = [finalProj, ...projects];
      setProjects(updated);
      if (finalProj.id !== newProj.id) {
        setActiveId(finalProj.id);
      }
      setSyncStatus("synced");
      showNotification("Proyecto creado en la nube ✓");
    } else {
      const updated = [newProj, ...projects];
      setProjects(updated);
      saveLanguageProjects(language, updated);
    }
  };

  // Move Project to Folder (or root if null/"")
  const handleMoveProject = async (id: string, folder: string | null) => {
    const cleanFolder = folder?.trim() || undefined;
    let targetProject: Project | null = null;
    const updated = projects.map((p) => {
      if (p.id === id) {
        const upd: Project = { ...p, folder: cleanFolder, updatedAt: Date.now() };
        targetProject = upd;
        return upd;
      }
      return p;
    });
    setProjects(updated);

    if (authUser && targetProject) {
      setSyncStatus("saving");
      await saveProjectToCloud(targetProject);
      setSyncStatus("synced");
    } else if (!authUser) {
      saveLanguageProjects(language, updated);
    }
  };

  // Rename a Folder across all projects that belong to it
  const handleRenameFolder = async (oldFolder: string, newFolder: string) => {
    const cleanOld = oldFolder.trim();
    const cleanNew = newFolder.trim();
    if (!cleanOld || !cleanNew || cleanOld === cleanNew) return;

    const toSync: Project[] = [];
    const updated = projects.map((p) => {
      if ((p.folder || "").trim() === cleanOld) {
        const upd: Project = { ...p, folder: cleanNew, updatedAt: Date.now() };
        toSync.push(upd);
        return upd;
      }
      return p;
    });
    setProjects(updated);

    if (authUser && toSync.length > 0) {
      setSyncStatus("saving");
      await pushProjectsToCloud(toSync);
      setSyncStatus("synced");
      showNotification(`Carpeta "${cleanOld}" renombrada a "${cleanNew}" ✓`);
    } else if (!authUser) {
      saveLanguageProjects(language, updated);
    }
  };

  // Delete a Folder: either move its projects to root or delete them
  const handleDeleteFolder = async (folderName: string, deleteProjects: boolean) => {
    const cleanFolder = folderName.trim();
    if (!cleanFolder) return;

    if (deleteProjects) {
      const toDelete = projects.filter((p) => (p.folder || "").trim() === cleanFolder);
      const updated = projects.filter((p) => (p.folder || "").trim() !== cleanFolder);
      setProjects(updated);

      if (authUser) {
        setSyncStatus("saving");
        await Promise.all(toDelete.map((p) => deleteProjectFromCloud(p.id)));
        setSyncStatus("synced");
      } else {
        saveLanguageProjects(language, updated);
      }

      if (activeProjectId && toDelete.some((p) => p.id === activeProjectId)) {
        if (updated.length > 0) {
          handleSelectProject(updated[0].id);
        } else {
          setActiveId(null);
          if (!authUser) setActiveProjectId(null, language);
          setCode("");
          setStdin("");
          setProjectName("Sin proyectos");
          setOutput(null);
        }
      }
      showNotification(`Carpeta "${cleanFolder}" y sus proyectos eliminados ✓`);
    } else {
      const toSync: Project[] = [];
      const updated = projects.map((p) => {
        if ((p.folder || "").trim() === cleanFolder) {
          const upd: Project = { ...p, folder: undefined, updatedAt: Date.now() };
          toSync.push(upd);
          return upd;
        }
        return p;
      });
      setProjects(updated);

      if (authUser && toSync.length > 0) {
        setSyncStatus("saving");
        await pushProjectsToCloud(toSync);
        setSyncStatus("synced");
      } else if (!authUser) {
        saveLanguageProjects(language, updated);
      }
      showNotification(`Proyectos movidos a la raíz ✓`);
    }
  };

  // Delete Project in current language
  const handleDeleteProject = async (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);

    if (authUser) {
      setSyncStatus("saving");
      await deleteProjectFromCloud(id);
      setSyncStatus("synced");
      showNotification("Proyecto eliminado de la nube ✓");
    } else {
      saveLanguageProjects(language, updated);
    }

    if (activeProjectId === id) {
      if (updated.length > 0) {
        handleSelectProject(updated[0].id);
      } else {
        setActiveId(null);
        if (!authUser) {
          setActiveProjectId(null, language);
        }
        setCode("");
        setStdin("");
        setProjectName("Sin proyectos");
        setOutput(null);
      }
    }
  };

  // Push to Cloud
  const handlePush = async () => {
    if (!authUser) {
      window.location.href = "/login";
      return;
    }
    setSyncStatus("saving");
    try {
      const pushed = await pushProjectsToCloud(projects);
      if (pushed && pushed.length > 0) {
        setProjects(pushed);
        setSyncStatus("synced");
        showNotification(`Sincronizado: ${pushed.length} proyectos guardados en la nube ✓`);
      } else {
        setSyncStatus("synced");
        showNotification("Nube actualizada ✓");
      }
    } catch {
      setSyncStatus("error");
      showNotification("Error en sincronización a la nube");
    }
  };

  // Pull from Cloud
  const handlePull = async () => {
    if (!authUser) {
      window.location.href = "/login";
      return;
    }
    setSyncStatus("saving");
    try {
      const cloudProjs = await pullProjectsFromCloud();
      const cloudForLang = cloudProjs.filter((p) => (p.language || "cpp") === language);

      if (cloudForLang.length > 0) {
        setProjects(cloudForLang);

        const currentActive = cloudForLang.find((p) => p.id === activeProjectId) || cloudForLang[0];
        if (currentActive) {
          setActiveId(currentActive.id);
          setCode(currentActive.code);
          setStdin(currentActive.stdin);
          setCompiler(currentActive.compiler);
          setStandard(currentActive.options || getLanguage(language).defaultStandard);
          setCompilerSettings(currentActive.settings || DEFAULT_COMPILER_SETTINGS);
          setProjectName(currentActive.name);
        }

        setSyncStatus("synced");
        showNotification(`Descargados ${cloudForLang.length} proyectos de la nube ✓`);
      } else {
        setSyncStatus("synced");
        showNotification("No hay proyectos en la nube para este lenguaje");
      }
    } catch {
      setSyncStatus("error");
      showNotification("Error al descargar de la nube");
    }
  };

  // Bidirectional Intelligent Sync
  const handleBidirectionalSync = async () => {
    if (!authUser) {
      window.location.href = "/login";
      return;
    }
    setSyncStatus("saving");
    try {
      const res = await syncBidirectional(projects);
      const forLang = res.merged.filter((p) => (p.language || "cpp") === language);
      setProjects(forLang);

      const activeCurrent = forLang.find((p) => p.id === activeProjectId);
      if (activeCurrent) {
        setCode(activeCurrent.code);
        setStdin(activeCurrent.stdin);
        setProjectName(activeCurrent.name);
      }

      setSyncStatus("synced");
      showNotification("Proyectos sincronizados con la nube ✓");
    } catch {
      setSyncStatus("error");
      showNotification("Error al sincronizar con la nube");
    }
  };

  // Rename Project
  const handleRenameProject = async (id: string, newName: string) => {
    let targetProject: Project | null = null;
    const updated = projects.map((p) => {
      if (p.id === id) {
        const upd = { ...p, name: newName, updatedAt: Date.now() };
        targetProject = upd;
        return upd;
      }
      return p;
    });
    setProjects(updated);

    if (authUser && targetProject) {
      setSyncStatus("saving");
      await saveProjectToCloud(targetProject);
      setSyncStatus("synced");
    } else if (!authUser) {
      saveLanguageProjects(language, updated);
    }

    if (activeProjectId === id) {
      setProjectName(newName);
    }
  };

  // Load Template
  const handleSelectTemplate = async (template: CodeTemplate) => {
    const templateLang = template.language || "cpp";
    const langDef = getLanguage(templateLang);

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

    if (authUser) {
      setSyncStatus("saving");
      const saved = await saveProjectToCloud(newProj);
      const finalProj = saved || newProj;
      const updated = [finalProj, ...projects];
      setProjects(updated);
      handleSelectProject(finalProj.id, updated);
      setSyncStatus("synced");
      showNotification(`Plantilla guardada en la nube ✓`);
    } else {
      const updated = [newProj, ...projects];
      setProjects(updated);
      saveLanguageProjects(language, updated);
      handleSelectProject(newProj.id, updated);
      showNotification(`Plantilla "${template.title}" cargada`);
    }
  };

  // Code Formatter
  const handleFormatCode = () => {
    if (!code || !activeProjectId) return;
    const formatted = formatCode(code, language);
    setCode(formatted);
    showNotification("Código formateado ✓");
  };

  // Share via modal
  const handleShare = () => {
    if (!activeProjectId) {
      showNotification("Crea un proyecto para poder compartir");
      return;
    }
    setIsShareModalOpen(true);
  };

  // Export Project Files
  const handleExport = () => {
    if (!activeProjectId) {
      showNotification("Crea un proyecto para poder exportar");
      return;
    }
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
    if (!activeProjectId || projects.length === 0) {
      showNotification("Crea un proyecto para ejecutar código");
      return;
    }

    if (effectiveConsoleMode === "interactive" && !isWebPreview) {
      setInteractiveRunTrigger((prev) => prev + 1);
      return;
    }

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
  const effectiveConsoleMode: ConsoleMode = isWebPreview ? "split" : consoleMode;

  const editorPanel = projects.length === 0 ? (
    <div className="relative w-full h-full min-h-0 min-w-0 flex flex-col items-center justify-center bg-[#090a0f] p-6 text-center select-none font-mono">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500 shadow-inner">
        <FileCode className="w-6 h-6 text-zinc-500" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-200 mb-1">
        Sin proyectos en {langDef.name}
      </h3>
      <p className="text-xs text-zinc-500 max-w-sm mb-4">
        Actualmente no tienes ningún proyecto en este lenguaje.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleCreateProject()}
          className="px-3.5 py-1.5 rounded bg-neon-green text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-[#00e67a] active:bg-[#00cc6c] transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Proyecto</span>
        </button>
        <button
          onClick={() => setIsTemplatesOpen(true)}
          className="px-3.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-xs flex items-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Ver Plantillas</span>
        </button>
      </div>
    </div>
  ) : (
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
      disabled={isRunning || !activeProjectId}
      onMaximize={() => setMaximizedPanel(maximizedPanel === "stdin" ? null : "stdin")}
      isMaximized={maximizedPanel === "stdin"}
      onSwitchToInteractive={handleToggleConsoleMode}
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

  const interactiveTerminalPanel = (
    <InteractiveTerminal
      code={code}
      language={language}
      compiler={compiler}
      standard={standard}
      compilerSettings={compilerSettings}
      onSwitchToSplit={handleToggleConsoleMode}
      onMaximize={() => setMaximizedPanel(maximizedPanel === "output" ? null : "output")}
      isMaximized={maximizedPanel === "output"}
      initialStdin={stdin}
      onStdinChange={setStdin}
      runTrigger={interactiveRunTrigger}
      onRunningChange={setIsRunning}
    />
  );

  const renderPanel = (pid: PanelId) => {
    if (pid === "editor") return editorPanel;
    if (consoleMode === "interactive" && !isWebPreview) {
      if (pid === "stdin" || pid === "output") return interactiveTerminalPanel;
    }
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
          onProjectNameChange={(newName) => {
            if (activeProjectId) handleRenameProject(activeProjectId, newName);
          }}
          hasActiveProject={Boolean(activeProjectId)}
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
          onPull={handlePull}
          onPush={handlePush}
          onBidirectionalSync={handleBidirectionalSync}
          authUser={authUser}
          onUserChange={setAuthUser}
          consoleMode={consoleMode}
          onToggleConsoleMode={handleToggleConsoleMode}
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
              onMoveProject={handleMoveProject}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              width={sidebarWidth}
              languageName={langDef.name}
              isLoggedIn={Boolean(authUser)}
              onSyncAllToCloud={handleBidirectionalSync}
              onPull={handlePull}
              onPush={handlePush}
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
                {effectiveConsoleMode === "interactive" ? (
                  <div className="w-full h-full min-w-0 overflow-hidden">
                    {interactiveTerminalPanel}
                  </div>
                ) : effectiveShowStdin ? (
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
                {effectiveConsoleMode === "interactive" ? (
                  <div className="w-full h-full min-w-0 overflow-hidden">
                    {interactiveTerminalPanel}
                  </div>
                ) : effectiveShowStdin ? (
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

              {effectiveConsoleMode === "interactive" ? (
                <div
                  style={{ width: `calc(${100 - col1Width}% - 4px)` }}
                  className="h-full min-w-0 overflow-hidden flex-1"
                >
                  {interactiveTerminalPanel}
                </div>
              ) : effectiveShowStdin ? (
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

              {effectiveConsoleMode === "interactive" ? (
                <div
                  style={{ height: `calc(${100 - row1Height}% - 4px)` }}
                  className="w-full min-h-0 overflow-hidden flex-1"
                >
                  {interactiveTerminalPanel}
                </div>
              ) : effectiveShowStdin ? (
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
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectName={projectName}
        language={language}
        code={code}
        stdin={stdin}
        compiler={compiler}
        standard={standard}
        settings={compilerSettings}
      />

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
