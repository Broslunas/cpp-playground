import { Project, CompilerSettings, SupportedLanguage } from "@/types";
import { getLanguage, LANGUAGES } from "./languages";

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
    const parsed: Project[] = JSON.parse(data);
    // Ensure all projects have language field
    return parsed.map((p) => ({
      ...p,
      language: p.language || "cpp",
    }));
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
  code?: string,
  standard?: string,
  stdin: string = "",
  settings?: CompilerSettings,
  language: SupportedLanguage = "cpp"
): Project {
  const langDef = getLanguage(language);

  return {
    id: crypto.randomUUID(),
    name,
    language,
    code: code !== undefined ? code : langDef.defaultCode,
    stdin,
    compiler: langDef.defaultCompiler,
    options: standard || langDef.defaultStandard,
    settings,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createInitialProject(): Project {
  return {
    id: "default-hello-world",
    name: "Hello World",
    language: "cpp",
    code: LANGUAGES.cpp.defaultCode,
    stdin: "World",
    compiler: LANGUAGES.cpp.defaultCompiler,
    options: LANGUAGES.cpp.defaultStandard,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
