import { LanguageDefinition, SupportedLanguage } from "@/types";

export const HTML_DEFAULT_CODE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML/CSS/JS Playground</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f111a;
      color: #e6edf3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 2rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    h1 {
      font-size: 1.6rem;
      margin-bottom: 0.5rem;
      color: #00ff88;
    }
    p {
      color: #8b949e;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }
    .counter {
      font-size: 3rem;
      font-weight: 700;
      color: #58a6ff;
      margin-bottom: 1.5rem;
      font-family: monospace;
    }
    .btn-group {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    button {
      background: #238636;
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    button:hover {
      background: #2ea043;
      transform: translateY(-1px);
    }
    button.secondary {
      background: #21262d;
      border: 1px solid #30363d;
      color: #c9d1d9;
    }
    button.secondary:hover {
      background: #30363d;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 HTML + CSS + JS</h1>
    <p>Todo en un mismo bloque interactivo.</p>
    <div class="counter" id="counter">0</div>
    <div class="btn-group">
      <button id="decBtn" class="secondary">-1</button>
      <button id="resetBtn" class="secondary">Reset</button>
      <button id="incBtn">+1</button>
    </div>
  </div>

  <script>
    let count = 0;
    const counterEl = document.getElementById("counter");
    const incBtn = document.getElementById("incBtn");
    const decBtn = document.getElementById("decBtn");
    const resetBtn = document.getElementById("resetBtn");

    console.log("¡Playground HTML/CSS/JS listo!");

    incBtn.addEventListener("click", () => {
      count++;
      counterEl.textContent = count;
      console.log("Contador incrementado:", count);
    });

    decBtn.addEventListener("click", () => {
      count--;
      counterEl.textContent = count;
      console.log("Contador decrementado:", count);
    });

    resetBtn.addEventListener("click", () => {
      count = 0;
      counterEl.textContent = count;
      console.log("Contador reseteado");
    });
  </script>
</body>
</html>
`;

export const JS_DEFAULT_CODE = `// JavaScript (Node.js) Playground
const readline = require("readline");

async function main() {
  console.log("¡Hola desde JavaScript (Node.js)!");
  console.log("Node version:", process.version);

  // Procesamiento de datos funcional
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const stats = numbers.reduce(
    (acc, curr) => ({
      sum: acc.sum + curr,
      evens: curr % 2 === 0 ? [...acc.evens, curr] : acc.evens,
    }),
    { sum: 0, evens: [] }
  );

  console.log("Stats:", JSON.stringify(stats, null, 2));

  // Lectura de stdin si existe
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  for await (const line of rl) {
    if (line.trim()) {
      console.log(\`Leído de stdin: \${line}\`);
    }
  }
}

main().catch(console.error);
`;

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
  html: {
    id: "html",
    name: "HTML/CSS/JS",
    extension: ".html",
    defaultCode: HTML_DEFAULT_CODE,
    defaultCompiler: "browser-dom",
    defaultStandard: "HTML5",
    hasCompilerSettings: false,
    isWebPreview: true,
    compilers: [
      {
        id: "browser-dom",
        name: "Navegador (Live DOM & Preview)",
        version: "HTML5/CSS3/ES6+",
        standards: ["HTML5"],
      },
    ],
  },
  javascript: {
    id: "javascript",
    name: "JavaScript",
    extension: ".js",
    defaultCode: JS_DEFAULT_CODE,
    defaultCompiler: "nodejs-20.17.0",
    defaultStandard: "ES2023",
    hasCompilerSettings: false,
    compilers: [
      {
        id: "nodejs-20.17.0",
        name: "Node.js 20.17.0",
        version: "20.17.0",
        standards: ["ES2023", "CommonJS", "ESNext"],
      },
      {
        id: "nodejs-18.20.4",
        name: "Node.js 18.20.4 (LTS)",
        version: "18.20.4",
        standards: ["ES2022", "CommonJS"],
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
