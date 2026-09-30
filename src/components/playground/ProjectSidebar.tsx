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
} from "lucide-react";
import { Project } from "@/types";

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
    element.download = `${project.name.toLowerCase().replace(/\s+/g, "_")}.cc`;
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
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-300">
          <FolderOpen className="w-4 h-4 text-neon-green" />
          <span>LOCAL PROJECTS</span>
        </div>
        <button
          onClick={onCreateProject}
          className="px-2 py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green hover:text-black rounded text-xs font-mono flex items-center gap-1 transition-colors"
          title="Create New Project"
          aria-label="Create New Project"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {projects.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-zinc-600">
            No projects found. Create one!
          </div>
        ) : (
          projects.map((project) => {
            const isActive = project.id === activeProjectId;
            const isEditing = project.id === editingId;

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
                      aria-label="Confirm Rename"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
                      aria-label="Cancel Rename"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate">
                      <FileCode
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-neon-green" : "text-zinc-500"
                        }`}
                      />
                      <span className="truncate">{project.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDownload(project, e)}
                        className="p-1 text-zinc-400 hover:text-white rounded"
                        title="Download .cc file"
                        aria-label={`Download ${project.name}`}
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleStartRename(project, e)}
                        className="p-1 text-zinc-400 hover:text-white rounded"
                        title="Rename project"
                        aria-label={`Rename ${project.name}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {projects.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete project "${project.name}"?`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="p-1 text-zinc-400 hover:text-red-400 rounded"
                          title="Delete project"
                          aria-label={`Delete ${project.name}`}
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

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
        <span>Stored in localStorage</span>
        <span>{projects.length} project(s)</span>
      </div>
    </aside>
  );
}
