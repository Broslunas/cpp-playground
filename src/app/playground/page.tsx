"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Toolbar } from "@/components/playground/Toolbar";
import { Editor } from "@/components/playground/Editor";
import { StdinPanel } from "@/components/playground/StdinPanel";
import { OutputPanel } from "@/components/playground/OutputPanel";
import { ProjectSidebar } from "@/components/playground/ProjectSidebar";
import {
  getProjects,
  saveProjects,
  getActiveProjectId,
  setActiveProjectId,
  createProject,
} from "@/lib/projects";
import { Project, CompileResponse } from "@/types";

export default function PlaygroundPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Active project state
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [compiler, setCompiler] = useState("gcc-head");
  const [standard, setStandard] = useState("c++20");
  const [projectName, setProjectName] = useState("Loading...");

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<CompileResponse | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const loadedProjects = getProjects();
    setProjects(loadedProjects);

    const savedActiveId = getActiveProjectId();
    const active =
      loadedProjects.find((p) => p.id === savedActiveId) || loadedProjects[0];

    if (active) {
      setActiveId(active.id);
      setCode(active.code);
      setStdin(active.stdin);
      setCompiler(active.compiler);
      setStandard(active.options || "c++20");
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
              updatedAt: Date.now(),
            }
          : p
      );
      saveProjects(updated);
      return updated;
    });

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  }, [activeProjectId, code, stdin, compiler, standard]);

  // Auto-save debounced
  const timeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (!activeProjectId) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveCurrentProject();
    }, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [code, stdin, compiler, standard, saveCurrentProject, activeProjectId]);

  // Project selection
  const handleSelectProject = (id: string) => {
    // Save current first
    saveCurrentProject();

    const target = projects.find((p) => p.id === id);
    if (target) {
      setActiveId(target.id);
      setActiveProjectId(target.id);
      setCode(target.code);
      setStdin(target.stdin);
      setCompiler(target.compiler);
      setStandard(target.options || "c++20");
      setProjectName(target.name);
      setOutput(null);
    }
  };

  // Create Project
  const handleCreateProject = () => {
    const newProj = createProject(`Project ${projects.length + 1}`);
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
        }),
      });

      const data: CompileResponse = await response.json();
      setOutput(data);
    } catch (err: unknown) {
      const error = err as Error;
      setOutput({
        stdout: "",
        stderr: error.message || "Failed to reach compilation server.",
        compilerOutput: "",
        exitCode: 1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Global Ctrl+Enter shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, stdin, compiler, standard, isRunning]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#090a0f]">
      {/* Top Toolbar */}
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
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Projects Sidebar */}
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

        {/* Central Workspace (Editor + Bottom I/O Panels) */}
        <main
          id="main-content"
          className="flex-1 flex flex-col p-2 sm:p-3 gap-2 overflow-hidden"
          role="main"
        >
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

      {/* Save Notification Toast */}
      {saveToast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 bg-neon-green/90 text-black px-3 py-1.5 rounded shadow-lg text-xs font-mono font-semibold transition-opacity duration-300 z-50 pointer-events-none"
        >
          Project saved locally ✓
        </div>
      )}
    </div>
  );
}
