"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileCode,
  Download,
  FolderOpen,
  Cloud,
  CloudUpload,
  CloudDownload,
} from "lucide-react";
import { Project } from "@/types";
import { getLanguage } from "@/lib/languages";

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  languageName?: string;
  isLoggedIn?: boolean;
  onSyncAllToCloud?: () => void;
  onPull?: () => void;
  onPush?: () => void;
}

export function ProjectSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  isOpen,
  onClose,
  width = 260,
  languageName,
  isLoggedIn = false,
  onSyncAllToCloud,
  onPull,
  onPush,
}: ProjectSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (!isOpen) return null;

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

  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-[#0a0d13] border-r border-zinc-800 flex flex-col h-full z-20 shrink-0 select-none"
      aria-label="Local Projects Management"
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
          Proyectos {languageName ? `· ${languageName}` : ""}
        </span>
        <div className="flex items-center gap-0.5">
          {isLoggedIn && (
            <>
              {onPull && (
                <button
                  onClick={onPull}
                  className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                  title="Pull: descargar proyectos de la nube"
                  aria-label="Descargar proyectos de la nube"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                </button>
              )}
              {onPush && (
                <button
                  onClick={onPush}
                  className="p-1 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-colors"
                  title="Push: subir proyectos locales a la nube"
                  aria-label="Subir proyectos locales a la nube"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
          <button
            onClick={onCreateProject}
            className="p-1 text-zinc-400 hover:text-neon-green hover:bg-zinc-800/80 rounded transition-colors ml-0.5"
            title="Nuevo proyecto"
            aria-label="Nuevo proyecto"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {projects.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-zinc-600">
            No hay proyectos {languageName ? `en ${languageName}` : ""}. ¡Crea uno!
          </div>
        ) : (
          projects.map((project) => {
            const isActive = project.id === activeProjectId;
            const isEditing = project.id === editingId;
            const ext = getLanguage(project.language).extension;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`group flex items-center justify-between p-2 rounded text-xs font-mono cursor-pointer transition-colors ${
                  isActive
                    ? "bg-zinc-800/80 border border-zinc-700 text-neon-green"
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
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCode
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-neon-green" : "text-zinc-500"
                        }`}
                      />
                      <span className="truncate">{project.name}</span>
                      {project.isCloud && (
                        <span title="Sincronizado en la nube" className="inline-flex">
                          <Cloud className="w-3 h-3 text-cyan-400/80 shrink-0" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDownload(project, e)}
                        className="p-1 text-zinc-400 hover:text-white rounded"
                        title={`Descargar archivo (${ext})`}
                        aria-label={`Descargar ${project.name}`}
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleStartRename(project, e)}
                        className="p-1 text-zinc-400 hover:text-white rounded"
                        title="Renombrar proyecto"
                        aria-label={`Renombrar ${project.name}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {projects.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Eliminar proyecto "${project.name}"?`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="p-1 text-zinc-400 hover:text-red-400 rounded"
                          title="Eliminar proyecto"
                          aria-label={`Eliminar ${project.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
