import { Project, CompilerSettings } from "@/types";
import { DEFAULT_CODE } from "./compiler";

const STORAGE_KEY = "cpp-playground-projects";
const ACTIVE_PROJECT_KEY = "cpp-playground-active-id";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initial = createInitialProject();
      saveProjects([initial]);
      return [initial];
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to save projects to localStorage", e);
  }
}

export function getActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function createProject(
  name = "Untitled Project",
  code: string = DEFAULT_CODE,
  standard: string = "c++20",
  stdin: string = "",
  settings?: CompilerSettings
): Project {
  return {
    id: crypto.randomUUID(),
    name,
    code,
    stdin,
    compiler: "gcc-head",
    options: standard,
    settings,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createInitialProject(): Project {
  return {
    id: "default-hello-world",
    name: "Hello World",
    code: DEFAULT_CODE,
    stdin: "World",
    compiler: "gcc-head",
    options: "c++20",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

