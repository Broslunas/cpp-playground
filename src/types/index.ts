export interface Project {
  id: string;
  name: string;
  code: string;
  stdin: string;
  compiler: string;
  options: string;
  createdAt: number;
  updatedAt: number;
}

export interface CompileRequest {
  code: string;
  stdin?: string;
  compiler?: string;
  options?: string;
}

export interface CompileResponse {
  stdout: string;
  stderr: string;
  compilerOutput: string;
  exitCode: number;
  time?: string;
  error?: string;
}

export interface CompilerOption {
  id: string;
  name: string;
  version: string;
  standards: string[];
}
