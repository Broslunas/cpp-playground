import { LanguageDefinition, SupportedLanguage } from "@/types";

export const PYTHON_DEFAULT_CODE = `# Playground Python 3
import sys

def main():
    print("¡Hola desde Python!")
    print(f"Versión: {sys.version.split()[0]}")

    # Ejemplo de lectura de stdin
    line = sys.stdin.readline().strip()
    if line:
        print(f"Leído de stdin: {line}")

if __name__ == "__main__":
    main()
`;

export const CPP_DEFAULT_CODE = `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::cout << "Hello, C++ Playground!\\n" << std::endl;

    // Example: Read from stdin if provided
    std::string input;
    if (std::cin >> input) {
        std::cout << "Read from stdin: " << input << std::endl;
    }

    return 0;
}
`;

export const LANGUAGES: Record<SupportedLanguage, LanguageDefinition> = {
  cpp: {
    id: "cpp",
    name: "C++",
    extension: ".cc",
    defaultCode: CPP_DEFAULT_CODE,
    defaultCompiler: "gcc-head",
    defaultStandard: "c++20",
    hasCompilerSettings: true,
    compilers: [
      {
        id: "gcc-head",
        name: "GCC (HEAD / Latest)",
        version: "14+",
        standards: ["c++23", "c++20", "c++17", "c++14", "c++11"],
      },
      {
        id: "clang-head",
        name: "Clang (HEAD / Latest)",
        version: "19+",
        standards: ["c++23", "c++20", "c++17", "c++14", "c++11"],
      },
      {
        id: "gcc-13.2.0",
        name: "GCC 13.2.0",
        version: "13.2.0",
        standards: ["c++23", "c++20", "c++17", "c++14", "c++11"],
      },
      {
        id: "clang-17.0.1",
        name: "Clang 17.0.1",
        version: "17.0.1",
        standards: ["c++23", "c++20", "c++17", "c++14", "c++11"],
      },
    ],
  },
  python: {
    id: "python",
    name: "Python",
    extension: ".py",
    defaultCode: PYTHON_DEFAULT_CODE,
    defaultCompiler: "cpython-3.12.7",
    defaultStandard: "3.12",
    hasCompilerSettings: false,
    compilers: [
      {
        id: "cpython-3.12.7",
        name: "CPython 3.12.7",
        version: "3.12.7",
        standards: ["3.12"],
      },
      {
        id: "cpython-3.11.10",
        name: "CPython 3.11.10",
        version: "3.11.10",
        standards: ["3.11"],
      },
      {
        id: "pypy-3.10-v7.3.17",
        name: "PyPy 3.10 (7.3.17)",
        version: "3.10",
        standards: ["3.10"],
      },
      {
        id: "cpython-2.7.18",
        name: "CPython 2.7.18 (Legacy)",
        version: "2.7.18",
        standards: ["2.7"],
      },
    ],
  },
};

export const SUPPORTED_LANGUAGES_LIST: LanguageDefinition[] = Object.values(LANGUAGES);

export function getLanguage(id?: string): LanguageDefinition {
  if (id && id in LANGUAGES) {
    return LANGUAGES[id as SupportedLanguage];
  }
  return LANGUAGES.cpp;
}
