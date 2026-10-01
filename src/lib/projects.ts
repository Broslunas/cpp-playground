import { Project, CompilerSettings, SupportedLanguage } from "@/types";
import { getLanguage, LANGUAGES } from "./languages";

const STORAGE_KEY = "cpp-playground-projects";
const ACTIVE_PROJECT_KEY = "cpp-playground-active-id";
const INITIALIZED_LANGS_KEY = "playground-initialized-langs";

function getInitializedLanguages(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const data = localStorage.getItem(INITIALIZED_LANGS_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch {
    return new Set();
  }
}

function markLanguageInitialized(lang: string): void {
  if (typeof window === "undefined") return;
  try {
    const set = getInitializedLanguages();
    set.add(lang);
    localStorage.setItem(INITIALIZED_LANGS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initial = createInitialProjectForLanguage("cpp");
      markLanguageInitialized("cpp");
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

export function getProjectsByLanguage(lang: SupportedLanguage): Project[] {
  if (typeof window === "undefined") return [];
  const all = getProjects();
  const filtered = all.filter((p) => (p.language || "cpp") === lang);

  const initialized = getInitializedLanguages();
  if (!initialized.has(lang)) {
    markLanguageInitialized(lang);
    if (filtered.length === 0) {
      const initial = createInitialProjectForLanguage(lang);
      saveProjects([...all, initial]);
      return [initial];
    }
  }

  return filtered;
}

export function saveLanguageProjects(lang: SupportedLanguage, langProjects: Project[]): void {
  if (typeof window === "undefined") return;
  const all = getProjects();
  const others = all.filter((p) => (p.language || "cpp") !== lang);
  saveProjects([...langProjects, ...others]);
}

export function getActiveProjectId(lang?: SupportedLanguage): string | null {
  if (typeof window === "undefined") return null;
  if (lang) {
    const langKey = `${ACTIVE_PROJECT_KEY}-${lang}`;
    const saved = localStorage.getItem(langKey);
    if (saved) return saved;
    if (lang === "cpp") return localStorage.getItem(ACTIVE_PROJECT_KEY);
    return null;
  }
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string | null, lang?: SupportedLanguage): void {
  if (typeof window === "undefined") return;
  if (!id) {
    if (lang) {
      localStorage.removeItem(`${ACTIVE_PROJECT_KEY}-${lang}`);
      if (lang === "cpp") {
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
      }
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
    return;
  }
  if (lang) {
    localStorage.setItem(`${ACTIVE_PROJECT_KEY}-${lang}`, id);
    if (lang === "cpp") {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    }
  } else {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  }
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

export function createInitialProjectForLanguage(lang: SupportedLanguage): Project {
  const langDef = getLanguage(lang);
  return {
    id: `default-${lang}-hello-world`,
    name: `Hello ${langDef.name}`,
    language: lang,
    code: langDef.defaultCode,
    stdin: lang === "python" ? "Mundo" : "World",
    compiler: langDef.defaultCompiler,
    options: langDef.defaultStandard,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
