"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileCode,
  Download,
  Cloud,
  CloudUpload,
  CloudDownload,
  Search,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderInput,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  MoveRight,
} from "lucide-react";
import { Project } from "@/types";
import { getLanguage } from "@/lib/languages";

type FilterType = "all" | "cloud" | "local";
type SortOption = "updated-desc" | "updated-asc" | "name-asc" | "name-desc" | "created-desc";

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (folder?: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onMoveProject?: (id: string, folder: string | null) => void;
  onRenameFolder?: (oldFolder: string, newFolder: string) => void;
  onDeleteFolder?: (folder: string, deleteProjects: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  languageName?: string;
  isLoggedIn?: boolean;
  onSyncAllToCloud?: () => void;
  onPull?: () => void;
  onPush?: () => void;
}

const CUSTOM_FOLDERS_STORAGE_KEY = "cpp-playground-custom-folders";

export function ProjectSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onMoveProject,
  onRenameFolder,
  onDeleteFolder,
  isOpen,
  onClose,
  width = 280,
  languageName,
  isLoggedIn = false,
  onSyncAllToCloud,
  onPull,
  onPush,
}: ProjectSidebarProps) {
  // Búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated-desc");

  // Carpetas colapsadas
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Carpetas locales persistidas (para carpetas vacías recién creadas)
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(CUSTOM_FOLDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modales y estados de edición
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [movingProject, setMovingProject] = useState<Project | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // Persistir carpetas personalizadas
  const saveCustomFolders = (folders: string[]) => {
    setCustomFolders(folders);
    try {
      localStorage.setItem(CUSTOM_FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    } catch {
      // Ignorar errores en almacenamiento local
    }
  };

  // Obtener todas las carpetas únicas
  const allFolders = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.folder && p.folder.trim()) {
        set.add(p.folder.trim());
      }
    });
    customFolders.forEach((f) => {
      if (f.trim()) set.add(f.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects, customFolders]);

  // Filtrado y ordenación
  const filteredProjects = useMemo(() => {
    let list = [...projects];

    // Filtro de origen
    if (filterType === "cloud") {
      list = list.filter((p) => p.isCloud);
    } else if (filterType === "local") {
      list = list.filter((p) => !p.isCloud);
    }

    // Búsqueda por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesFolder = Boolean(p.folder && p.folder.toLowerCase().includes(q));
        return matchesName || matchesFolder;
      });
    }

    // Ordenación
    list.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "updated-asc":
          return (a.updatedAt || 0) - (b.updatedAt || 0);
        case "created-desc":
          return (b.createdAt || 0) - (a.createdAt || 0);
        case "updated-desc":
        default:
          return (b.updatedAt || 0) - (a.updatedAt || 0);
      }
    });

    return list;
  }, [projects, filterType, searchQuery, sortBy]);

  // Agrupación por carpetas
  const { folderMap, rootProjects } = useMemo(() => {
    const map = new Map<string, Project[]>();
    allFolders.forEach((f) => map.set(f, []));

    const roots: Project[] = [];

    filteredProjects.forEach((p) => {
      const folder = p.folder?.trim();
      if (folder) {
        const existing = map.get(folder) || [];
        existing.push(p);
        map.set(folder, existing);
      } else {
        roots.push(p);
      }
    });

    return { folderMap: map, rootProjects: roots };
  }, [filteredProjects, allFolders]);

  if (!isOpen) return null;

  // Toggle de colapso de carpeta
  const toggleFolder = (folderName: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const toggleAllFolders = () => {
    const allCollapsed = allFolders.every((f) => collapsedFolders[f]);
    const newState: Record<string, boolean> = {};
    allFolders.forEach((f) => {
      newState[f] = !allCollapsed;
    });
    setCollapsedFolders(newState);
  };

  // Crear nueva carpeta
  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderName.trim();
    if (clean) {
      if (!allFolders.includes(clean)) {
        saveCustomFolders([...customFolders, clean]);
      }
      setCollapsedFolders((prev) => ({ ...prev, [clean]: false }));
    }
    setNewFolderName("");
    setIsCreatingFolder(false);
  };

  // Renombrar carpeta
  const handleStartRenameFolder = (folder: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setEditFolderName(folder);
  };

  const handleSaveRenameFolder = (oldFolder: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNew = editFolderName.trim();
    if (cleanNew && cleanNew !== oldFolder) {
      if (onRenameFolder) {
        onRenameFolder(oldFolder, cleanNew);
      }
      const updatedCustom = customFolders.map((f) => (f === oldFolder ? cleanNew : f));
      if (!updatedCustom.includes(cleanNew)) updatedCustom.push(cleanNew);
      saveCustomFolders(updatedCustom.filter((f) => f !== oldFolder));
    }
    setEditingFolder(null);
  };

  // Confirmar eliminación de carpeta
  const handleConfirmDeleteFolder = (deleteProjects: boolean) => {
    if (!folderToDelete) return;
    if (onDeleteFolder) {
      onDeleteFolder(folderToDelete, deleteProjects);
    }
    saveCustomFolders(customFolders.filter((f) => f !== folderToDelete));
    setFolderToDelete(null);
  };

  // Renombrar proyecto
  const handleStartRename = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditName(project.name);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editName.trim()) {
      onRenameProject(id, editName.trim());
    }
    setEditingId(null);
  };

  // Descargar archivo
  const handleDownload = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = document.createElement("a");
    const file = new Blob([project.code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    const ext = getLanguage(project.language).extension;
    element.download = `${project.name.toLowerCase().replace(/\s+/g, "_")}${ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Asignar carpeta a proyecto
  const handleAssignFolder = (projectId: string, targetFolder: string | null) => {
    if (onMoveProject) {
      onMoveProject(projectId, targetFolder);
    }
    setMovingProject(null);
  };

  const hasActiveFilters = filterType !== "all" || sortBy !== "updated-desc" || searchQuery !== "";

  const resetFilters = () => {
    setFilterType("all");
    setSortBy("updated-desc");
    setSearchQuery("");
  };

  // Renderizador de un proyecto en la lista
  const renderProjectItem = (project: Project, isNested = false) => {
    const isActive = project.id === activeProjectId;
    const isEditing = project.id === editingId;
    const ext = getLanguage(project.language).extension;

    return (
      <div
        key={project.id}
        onClick={() => onSelectProject(project.id)}
        className={`group flex items-center justify-between p-2 rounded text-xs font-mono cursor-pointer transition-colors ${
          isNested ? "ml-3 my-0.5 border-l-2 border-zinc-800/80 pl-2.5" : "my-0.5"
        } ${
          isActive
            ? "bg-zinc-800/90 border border-zinc-700 text-neon-green shadow-sm"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onSelectProject(project.id);
          }
        }}
        aria-current={isActive ? "true" : undefined}
      >
        {isEditing ? (
          <form
            onSubmit={(e) => handleSaveRename(project.id, e)}
            className="flex items-center gap-1 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              className="flex-1 bg-zinc-950 border border-neon-green rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="p-1 text-neon-green hover:bg-zinc-800 rounded"
              aria-label="Confirmar nombre"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
              aria-label="Cancelar renombrado"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1">
              <FileCode
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-neon-green" : "text-zinc-500"
                }`}
              />
              <span className="truncate" title={project.name}>
                {project.name}
              </span>
              {project.isCloud && (
                <span title="Sincronizado en la nube" className="inline-flex shrink-0">
                  <Cloud className="w-3 h-3 text-cyan-400/80 shrink-0" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {onMoveProject && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMovingProject(project);
                  }}
                  className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded"
                  title="Mover a carpeta..."
                  aria-label={`Mover ${project.name} a carpeta`}
                >
                  <FolderInput className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => handleDownload(project, e)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                title={`Descargar archivo (${ext})`}
                aria-label={`Descargar ${project.name}`}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => handleStartRename(project, e)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                title="Renombrar proyecto"
                aria-label={`Renombrar ${project.name}`}
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`¿Eliminar proyecto "${project.name}"?`)) {
                    onDeleteProject(project.id);
                  }
                }}
                className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded"
                title="Eliminar proyecto"
                aria-label={`Eliminar ${project.name}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-[#0a0d13] border-r border-zinc-800 flex flex-col h-full z-20 shrink-0 select-none"
      aria-label="Projects Management"
    >
      {/* Header Superior */}
      <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-300 uppercase">
            Proyectos {languageName ? `· ${languageName}` : ""}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
            {projects.length}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {isLoggedIn && (
            <>
              {onPull && (
                <button
                  onClick={onPull}
                  className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                  title="Pull: recargar proyectos de la nube"
                  aria-label="Recargar proyectos de la nube"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                </button>
              )}
              {onPush && (
                <button
                  onClick={onPush}
                  className="p-1 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-colors"
                  title="Push: forzar guardado en la nube"
                  aria-label="Forzar guardado en la nube"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          {/* Botón Nueva Carpeta */}
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 rounded transition-colors"
            title="Nueva carpeta"
            aria-label="Crear nueva carpeta"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          {/* Botón Nuevo Proyecto */}
          <button
            onClick={() => onCreateProject()}
            className="p-1 text-zinc-400 hover:text-neon-green hover:bg-zinc-800/80 rounded transition-colors ml-0.5"
            title="Nuevo proyecto"
            aria-label="Nuevo proyecto"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-2 border-b border-zinc-800/80 bg-zinc-950/40 space-y-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Input Buscador */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar proyecto o carpeta..."
              className="w-full pl-7 pr-6 py-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Toggle Filtros */}
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`p-1.5 rounded transition-colors border relative ${
              showFilters || filterType !== "all" || sortBy !== "updated-desc"
                ? "bg-zinc-800 border-zinc-700 text-neon-green"
                : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
            title="Opciones de filtros y orden"
            aria-label="Filtros y orden"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {(filterType !== "all" || sortBy !== "updated-desc") && (
              <span className="w-1.5 h-1.5 bg-neon-green rounded-full absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* Toggle Expandir/Colapsar carpetas */}
          {allFolders.length > 0 && (
            <button
              onClick={toggleAllFolders}
              className="p-1.5 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              title="Expandir / Colapsar todas las carpetas"
              aria-label="Expandir o colapsar carpetas"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Panel Colapsable de Filtros */}
        {showFilters && (
          <div className="p-2 bg-zinc-900/90 rounded border border-zinc-800 text-[11px] font-mono space-y-2 mt-1">
            {/* Filtro Origen */}
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold mb-1">Origen</div>
              <div className="grid grid-cols-3 gap-1">
                {(["all", "cloud", "local"] as FilterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`py-0.5 px-1.5 rounded text-center transition-colors ${
                      filterType === type
                        ? "bg-neon-green text-black font-semibold"
                        : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {type === "all" ? "Todos" : type === "cloud" ? "Nube" : "Local"}
                  </button>
                ))}
              </div>
            </div>

            {/* Ordenación */}
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold mb-1">Ordenar por</div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="updated-desc">Más recientes</option>
                <option value="updated-asc">Más antiguos</option>
                <option value="name-asc">Nombre (A - Z)</option>
                <option value="name-desc">Nombre (Z - A)</option>
                <option value="created-desc">Fecha de creación</option>
              </select>
            </div>

            {/* Reset Filtros */}
            {hasActiveFilters && (
              <div className="pt-1 flex items-center justify-between border-t border-zinc-800">
                <span className="text-[10px] text-zinc-500">
                  {filteredProjects.length} de {projects.length}
                </span>
                <button
                  onClick={resetFilters}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Restablecer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulario Inline Nueva Carpeta */}
      {isCreatingFolder && (
        <div className="p-2 border-b border-zinc-800 bg-zinc-900/60">
          <form onSubmit={handleCreateFolderSubmit} className="flex items-center gap-1">
            <FolderPlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nombre de la carpeta..."
              autoFocus
              className="flex-1 bg-zinc-950 border border-amber-400/80 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="p-1 text-neon-green hover:bg-zinc-800 rounded"
              title="Crear carpeta"
              aria-label="Confirmar carpeta"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName("");
              }}
              className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
              title="Cancelar"
              aria-label="Cancelar carpeta"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}

      {/* Lista de Proyectos / Árbol de Directorios */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {filteredProjects.length === 0 && allFolders.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-zinc-500">
            {hasActiveFilters ? (
              <div className="space-y-2">
                <p>No se encontraron proyectos con los filtros actuales.</p>
                <button
                  onClick={resetFilters}
                  className="px-2.5 py-1 rounded bg-zinc-800 text-neon-green hover:bg-zinc-700 transition-colors text-[11px]"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              `No hay proyectos ${languageName ? `en ${languageName}` : ""}. ¡Crea uno!`
            )}
          </div>
        ) : (
          <>
            {/* Renderizar Carpetas */}
            {allFolders.map((folderName) => {
              const folderItems = folderMap.get(folderName) || [];
              const isCollapsed = Boolean(collapsedFolders[folderName]) && !searchQuery.trim();
              const isEditingFld = editingFolder === folderName;

              return (
                <div key={folderName} className="mb-1.5">
                  {/* Cabecera de la carpeta */}
                  <div
                    onClick={() => toggleFolder(folderName)}
                    className="group flex items-center justify-between p-1.5 rounded text-xs font-mono cursor-pointer hover:bg-zinc-900/80 text-zinc-300 transition-colors"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleFolder(folderName);
                    }}
                  >
                    {isEditingFld ? (
                      <form
                        onSubmit={(e) => handleSaveRenameFolder(folderName, e)}
                        className="flex items-center gap-1 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          autoFocus
                          className="flex-1 bg-zinc-950 border border-amber-400 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 text-neon-green hover:bg-zinc-800 rounded"
                          aria-label="Guardar carpeta"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFolder(null)}
                          className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
                          aria-label="Cancelar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1">
                          {isCollapsed ? (
                            <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                          )}
                          {isCollapsed ? (
                            <Folder className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
                          ) : (
                            <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className="truncate font-semibold text-zinc-200">
                            {folderName}
                          </span>
                          <span className="text-[10px] text-zinc-500 ml-1">
                            ({folderItems.length})
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateProject(folderName);
                            }}
                            className="p-1 text-zinc-400 hover:text-neon-green hover:bg-zinc-800 rounded"
                            title={`Crear proyecto en "${folderName}"`}
                            aria-label={`Crear proyecto en ${folderName}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleStartRenameFolder(folderName, e)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                            title="Renombrar carpeta"
                            aria-label={`Renombrar carpeta ${folderName}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderToDelete(folderName);
                            }}
                            className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded"
                            title="Eliminar carpeta"
                            aria-label={`Eliminar carpeta ${folderName}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Contenido de la carpeta */}
                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {folderItems.length === 0 ? (
                        <div className="ml-5 p-1.5 text-[11px] font-mono text-zinc-600 italic">
                          Carpeta vacía
                        </div>
                      ) : (
                        folderItems.map((project) => renderProjectItem(project, true))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Separador si hay tanto carpetas como proyectos en raíz */}
            {allFolders.length > 0 && rootProjects.length > 0 && (
              <div className="pt-2 pb-1 px-1 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                <span>Raíz</span>
                <span className="flex-1 border-t border-zinc-800" />
              </div>
            )}

            {/* Proyectos en la Raíz */}
            {rootProjects.map((project) => renderProjectItem(project, false))}
          </>
        )}
      </div>

      {/* Modal / Diálogo: Mover Proyecto a Carpeta */}
      {movingProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-[#0f131a] border border-zinc-800 rounded-xl p-4 w-full max-w-sm font-mono text-xs shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                <FolderInput className="w-4 h-4 text-amber-400" />
                <span>Mover "{movingProject.name}"</span>
              </div>
              <button
                onClick={() => setMovingProject(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-zinc-400">
              Selecciona el directorio de destino o muévelo a la raíz:
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 py-1">
              {/* Opción Raíz */}
              <button
                onClick={() => handleAssignFolder(movingProject.id, null)}
                className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors ${
                  !movingProject.folder
                    ? "bg-neon-green/10 border border-neon-green/60 text-neon-green"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Raíz (Sin carpeta)</span>
                </div>
                {!movingProject.folder && <Check className="w-3.5 h-3.5" />}
              </button>

              {/* Lista de Carpetas Existentes */}
              {allFolders.map((f) => {
                const isCurrent = movingProject.folder === f;
                return (
                  <button
                    key={f}
                    onClick={() => handleAssignFolder(movingProject.id, f)}
                    className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors ${
                      isCurrent
                        ? "bg-amber-400/10 border border-amber-400/60 text-amber-400"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      <span>{f}</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>

            {/* Crear y asignar a nueva carpeta */}
            <div className="pt-2 border-t border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget.elements.namedItem("newFolder") as HTMLInputElement;
                  if (target && target.value.trim()) {
                    const clean = target.value.trim();
                    if (!allFolders.includes(clean)) {
                      saveCustomFolders([...customFolders, clean]);
                    }
                    handleAssignFolder(movingProject.id, clean);
                  }
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  name="newFolder"
                  type="text"
                  placeholder="+ Nueva carpeta..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded px-2 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-amber-400 text-black font-semibold rounded hover:bg-amber-300 transition-colors"
                >
                  Mover
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Diálogo: Confirmar Eliminación de Carpeta */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-[#0f131a] border border-zinc-800 rounded-xl p-4 w-full max-w-sm font-mono text-xs shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-zinc-200">
                Eliminar carpeta "{folderToDelete}"
              </span>
              <button
                onClick={() => setFolderToDelete(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-zinc-400">
              ¿Qué deseas hacer con los proyectos contenidos en esta carpeta?
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleConfirmDeleteFolder(false)}
                className="w-full p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold">Mover proyectos a la raíz</div>
                  <div className="text-[10px] text-zinc-400">
                    Conserva todos los archivos sin directorio asignado.
                  </div>
                </div>
                <MoveRight className="w-4 h-4 text-neon-green" />
              </button>

              <button
                onClick={() => handleConfirmDeleteFolder(true)}
                className="w-full p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold">Eliminar carpeta y proyectos</div>
                  <div className="text-[10px] text-rose-400/80">
                    Borra permanentemente todos los archivos de esta carpeta.
                  </div>
                </div>
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setFolderToDelete(null)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
