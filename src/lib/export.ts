import { CompilerSettings, SupportedLanguage } from "@/types";
import { getLanguage } from "./languages";

export function downloadSourceFile(filename: string, code: string, language: SupportedLanguage = "cpp") {
  const langDef = getLanguage(language);
  const ext = langDef.extension;
  const baseName = filename.replace(/\.(cpp|cc|cxx|c\+\+|c|h|hpp|py|html|htm|js|mjs)$/i, "");
  const cleanName = `${baseName}${ext}`;

  const mimeMap: Record<SupportedLanguage, string> = {
    cpp: "text/x-c++src;charset=utf-8",
    python: "text/x-python;charset=utf-8",
    html: "text/html;charset=utf-8",
    javascript: "text/javascript;charset=utf-8",
  };
  const mimeType = mimeMap[language] || "text/plain;charset=utf-8";
  const blob = new Blob([code], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Backward compatibility alias
export function downloadCcFile(filename: string, code: string) {
  downloadSourceFile(filename, code, "cpp");
}

export function generateCMakeLists(projectName: string, standard: string, settings?: CompilerSettings): string {
  const stdNum = standard.replace("c++", "");
  const optFlag = settings?.optimization || "-O2";
  const sanFlags = settings?.sanitizers && settings.sanitizers.length > 0
    ? ` -fsanitize=${settings.sanitizers.join(",")}`
    : "";

  return `cmake_minimum_required(VERSION 3.15)
project(${projectName.replace(/[^a-zA-Z0-9_-]/g, "_")} CXX)

set(CMAKE_CXX_STANDARD ${stdNum})
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "\${CMAKE_CXX_FLAGS} ${optFlag} -Wall -Wextra${sanFlags}")

add_executable(main main.cc)
`;
}

export function generateMakefile(standard: string, settings?: CompilerSettings): string {
  const optFlag = settings?.optimization || "-O2";
  const sanFlags = settings?.sanitizers && settings.sanitizers.length > 0
    ? ` -fsanitize=${settings.sanitizers.join(",")}`
    : "";

  return `CXX ?= g++
CXXFLAGS ?= -std=${standard} ${optFlag} -Wall -Wextra${sanFlags}

all: main

main: main.cc
\t$(CXX) $(CXXFLAGS) main.cc -o main

clean:
\trm -f main

run: main
\t./main

.PHONY: all clean run
`;
}
