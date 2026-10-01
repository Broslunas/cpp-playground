export interface CompilerSettings {
  optimization: string; // "-O0" | "-O1" | "-O2" | "-O3" | "-Os" | "-Ofast"
  sanitizers: string[]; // "address", "undefined", "leak", "thread"
  warnings: string[]; // "Wall", "Wextra", "Wpedantic", "Werror"
  customFlags: string;
}

export type SupportedLanguage = "cpp" | "python" | "html" | "javascript" | "typescript" | "bash";

export type PlaygroundLayout = "standard" | "two-column" | "columns" | "vertical" | "custom";

export type PanelId = "editor" | "stdin" | "output";

export interface CustomLayoutConfig {
  type: "linear" | "split";
  direction: "row" | "column";
  order: PanelId[];
  primaryPanel: PanelId;
  primaryPosition: "start" | "end";
  secondaryDirection: "row" | "column";
  secondaryOrder: [PanelId, PanelId];
  hiddenPanels: PanelId[];
  splitPrimaryPercent?: number;
  splitSecondaryPercent?: number;
  linearPercents?: number[];
}

export interface LanguageDefinition {
  id: SupportedLanguage;
  name: string;
  extension: string;
  defaultCode: string;
  defaultCompiler: string;
  defaultStandard: string;
  compilers: CompilerOption[];
  hasCompilerSettings?: boolean;
  isWebPreview?: boolean;
}

export interface Project {
  id: string;
  name: string;
  language?: SupportedLanguage;
  code: string;
  stdin: string;
  compiler: string;
  options: string;
  settings?: CompilerSettings;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  isCloud?: boolean;
}

export interface AuthUser {
  id: string;
  githubId: string;
  username: string;
  name: string;
  avatarUrl: string;
  email?: string;
}

export type CloudSyncState = "idle" | "saving" | "synced" | "error" | "offline";

export interface CompileRequest {
  language?: SupportedLanguage;
  code: string;
  stdin?: string;
  compiler?: string;
  options?: string;
  settings?: CompilerSettings;
  args?: string;
}

export interface CompileResponse {
  stdout: string;
  stderr: string;
  compilerOutput: string;
  exitCode: number;
  time?: string;
  executionTimeMs?: number;
  error?: string;
}

export interface CompilerOption {
  id: string;
  name: string;
  version: string;
  standards: string[];
}

export interface CodeTemplate {
  id: string;
  title: string;
  language?: SupportedLanguage;
  category:
    | "basics"
    | "cpp20"
    | "cpp23"
    | "dsa"
    | "testing"
    | "python-features"
    | "python-advanced"
    | "html-demos"
    | "js-basics"
    | "js-advanced";
  description: string;
  standard: string;
  code: string;
  stdin?: string;
}

