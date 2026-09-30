export interface CompilerSettings {
  optimization: string; // "-O0" | "-O1" | "-O2" | "-O3" | "-Os" | "-Ofast"
  sanitizers: string[]; // "address", "undefined", "leak", "thread"
  warnings: string[]; // "Wall", "Wextra", "Wpedantic", "Werror"
  customFlags: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  stdin: string;
  compiler: string;
  options: string;
  settings?: CompilerSettings;
  createdAt: number;
  updatedAt: number;
}

export interface CompileRequest {
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
  category: "basics" | "cpp20" | "cpp23" | "dsa" | "testing";
  description: string;
  standard: string;
  code: string;
  stdin?: string;
}

