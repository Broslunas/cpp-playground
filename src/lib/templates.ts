import { CodeTemplate } from "@/types";

export const CODE_TEMPLATES: CodeTemplate[] = [
  // C++ TEMPLATES
  {
    id: "hello-world",
    title: "Hola Mundo & I/O Básico",
    language: "cpp",
    category: "basics",
    description: "Plantilla inicial para entrada y salida estándar en C++.",
    standard: "c++20",
    code: `#include <iostream>
#include <string>

int main() {
    std::cout << "¡Hola desde C++ Playground!\\n";

    std::string nombre;
    if (std::cin >> nombre) {
        std::cout << "Bienvenido, " << nombre << "!\\n";
    }

    return 0;
}
`,
    stdin: "Desarrollador",
  },
  {
    id: "cpp20-ranges",
    title: "C++20: Ranges & Views",
    language: "cpp",
    category: "cpp20",
    description: "Filtrado, transformación y encadenamiento funcional con std::views.",
    standard: "c++20",
    code: `#include <iostream>
#include <vector>
#include <ranges>

int main() {
    std::vector<int> numeros = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Filtra pares y eleva al cuadrado en forma diferida (lazy evaluation)
    auto resultado = numeros
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    std::cout << "Pares al cuadrado: ";
    for (int n : resultado) {
        std::cout << n << " ";
    }
    std::cout << "\\n";

    return 0;
}
`,
  },
  {
    id: "cpp20-concepts",
    title: "C++20: Concepts & Constraints",
    language: "cpp",
    category: "cpp20",
    description: "Restricciones de tipos en tiempo de compilación para metaprogramación segura.",
    standard: "c++20",
    code: `#include <iostream>
#include <concepts>
#include <string>

// Definición de concepto numérico
template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

// Función restringida mediante el concepto
template <Numeric T>
T sumar(T a, T b) {
    return a + b;
}

int main() {
    std::cout << "Enteros: " << sumar(10, 25) << "\\n";
    std::cout << "Flotantes: " << sumar(3.1415, 2.7182) << "\\n";

    // sumar(std::string("A"), std::string("B")); // Error en compilación si se descomenta

    return 0;
}
`,
  },
  {
    id: "cpp23-print",
    title: "C++23: std::print & Formato",
    language: "cpp",
    category: "cpp23",
    description: "Uso de std::print y std::println nativo de C++23 con sintaxis pythonica.",
    standard: "c++23",
    code: `#include <print>
#include <vector>
#include <string>

int main() {
    std::string lenguaje = "C++23";
    int release = 2023;

    std::println("Bienvenido a {}, lanzado oficialmente en {}!", lenguaje, release);

    std::vector<std::string> features = {"std::print", "std::expected", "std::mdspan"};
    std::println("Novedades destacadas:");
    for (size_t i = 0; i < features.size(); ++i) {
        std::println("  {}. {}", i + 1, features[i]);
    }

    return 0;
}
`,
  },
  {
    id: "cpp23-expected",
    title: "C++23: std::expected (Manejo de Errores)",
    language: "cpp",
    category: "cpp23",
    description: "Manejo funcional de resultados y errores sin excepciones pesadas.",
    standard: "c++23",
    code: `#include <iostream>
#include <expected>
#include <string>

enum class ErrorMatematico {
    DivisionPorCero,
    RaizNegativa
};

std::expected<double, ErrorMatematico> dividir(double a, double b) {
    if (b == 0.0) {
        return std::unexpected(ErrorMatematico::DivisionPorCero);
    }
    return a / b;
}

int main() {
    auto res1 = dividir(10.0, 2.0);
    if (res1) {
        std::cout << "10 / 2 = " << *res1 << "\\n";
    }

    auto res2 = dividir(10.0, 0.0);
    if (!res2) {
        std::cout << "Error: ";
        if (res2.error() == ErrorMatematico::DivisionPorCero) {
            std::cout << "¡División por cero detectada!\\n";
        }
    }

    return 0;
}
`,
  },
  {
    id: "dsa-segment-tree",
    title: "DSA: Segment Tree (Árbol de Segmentos)",
    language: "cpp",
    category: "dsa",
    description: "Estructura para consultas de suma en rangos y actualizaciones puntuales en O(log N).",
    standard: "c++20",
    code: `#include <iostream>
#include <vector>

class SegmentTree {
private:
    int n;
    std::vector<long long> tree;

    void build(const std::vector<int>& arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
            return;
        }
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
            return;
        }
        int mid = (start + end) / 2;
        if (idx <= mid) update(2 * node, start, mid, idx, val);
        else update(2 * node + 1, mid + 1, end, idx, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    long long query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2 * node, start, mid, l, r) + query(2 * node + 1, mid + 1, end, l, r);
    }

public:
    SegmentTree(const std::vector<int>& arr) {
        n = arr.size();
        tree.resize(4 * n, 0);
        build(arr, 1, 0, n - 1);
    }

    void update(int idx, int val) { update(1, 0, n - 1, idx, val); }
    long long query(int l, int r) { return query(1, 0, n - 1, l, r); }
};

int main() {
    std::vector<int> datos = {1, 3, 5, 7, 9, 11};
    SegmentTree st(datos);

    std::cout << "Suma rango [1, 3] (3+5+7): " << st.query(1, 3) << "\\n";
    st.update(2, 10); // datos[2] = 10
    std::cout << "Suma tras actualizar datos[2] a 10 (3+10+7): " << st.query(1, 3) << "\\n";

    return 0;
}
`,
  },
  {
    id: "dsa-dsu",
    title: "DSA: Disjoint Set Union (DSU / Kruskal)",
    language: "cpp",
    category: "dsa",
    description: "Conjuntos disjuntos con unión por rango y compresión de caminos en casi O(1).",
    standard: "c++20",
    code: `#include <iostream>
#include <vector>
#include <numeric>

class DSU {
    std::vector<int> parent;
    std::vector<int> rank;

public:
    DSU(int n) : parent(n), rank(n, 0) {
        std::iota(parent.begin(), parent.end(), 0);
    }

    int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]); // Path compression
    }

    bool unite(int i, int j) {
        int root_i = find(i);
        int root_j = find(j);
        if (root_i != root_j) {
            if (rank[root_i] < rank[root_j])
                std::swap(root_i, root_j);
            parent[root_j] = root_i;
            if (rank[root_i] == rank[root_j])
                rank[root_i]++;
            return true;
        }
        return false;
    }
};

int main() {
    DSU dsu(5);
    std::cout << "Unir 0 y 1: " << (dsu.unite(0, 1) ? "Éxito" : "Ya conectados") << "\\n";
    std::cout << "Unir 1 y 2: " << (dsu.unite(1, 2) ? "Éxito" : "Ya conectados") << "\\n";
    std::cout << "¿Están 0 y 2 en el mismo componente? "
              << (dsu.find(0) == dsu.find(2) ? "Sí" : "No") << "\\n";
    std::cout << "¿Están 0 y 4 en el mismo componente? "
              << (dsu.find(0) == dsu.find(4) ? "Sí" : "No") << "\\n";
    return 0;
}
`,
  },
  {
    id: "testing-asserts",
    title: "Testing: Micro-Framework de Pruebas",
    language: "cpp",
    category: "testing",
    description: "Mini framework de assertions sin dependencias externas para test-driven development.",
    standard: "c++20",
    code: `#include <iostream>
#include <string>
#include <functional>
#include <vector>

void test(const std::string& name, std::function<void()> fn) {
    try {
        fn();
        std::cout << "[PASS] " << name << "\\n";
    } catch (const std::exception& e) {
        std::cout << "[FAIL] " << name << ": " << e.what() << "\\n";
    }
}

#define ASSERT_EQ(a, b) \\
    if ((a) != (b)) throw std::runtime_error("Se esperaba " + std::to_string(b) + " pero se obtuvo " + std::to_string(a))

int factorial(int n) {
    return (n <= 1) ? 1 : n * factorial(n - 1);
}

int main() {
    std::cout << "Ejecutando suite de pruebas:\\n";

    test("Factorial de 0", []() {
        ASSERT_EQ(factorial(0), 1);
    });

    test("Factorial de 5", []() {
        ASSERT_EQ(factorial(5), 120);
    });

    test("Factorial de 6", []() {
        ASSERT_EQ(factorial(6), 720);
    });

    return 0;
}
`,
  },

  // PYTHON TEMPLATES
  {
    id: "python-hello",
    title: "Python: Hola Mundo & I/O",
    language: "python",
    category: "basics",
    description: "Entrada/salida estándar, f-strings e introspección de versión en Python 3.",
    standard: "3.12",
    code: `import sys

def main():
    print("¡Hola desde Python Playground! 🐍")
    print(f"Versión de Python en ejecución: {sys.version.split()[0]}")

    # Lectura de stdin si se proporciona
    entrada = sys.stdin.readline().strip()
    if entrada:
        print(f"Mensaje recibido por stdin: '{entrada}'")
    else:
        print("Tip: Puedes ingresar texto en el panel Stdin abajo a la izquierda.")

if __name__ == "__main__":
    main()
`,
    stdin: "Mundo Python",
  },
  {
    id: "python-comprehensions",
    title: "Python: Comprehensions & Generadores",
    language: "python",
    category: "python-features",
    description: "Comprensión de listas, diccionarios y generadores con evaluación diferida (yield).",
    standard: "3.12",
    code: `def fibonacci_gen(limit: int):
    """Generador eficiente de serie de Fibonacci en memoria O(1)."""
    a, b = 0, 1
    count = 0
    while count < limit:
        yield a
        a, b = b, a + b
        count += 1

def main():
    # 1. List comprehension con filtrado y transformación
    numeros = list(range(1, 16))
    pares_cuadrados = [x**2 for x in numeros if x % 2 == 0]
    print(f"Pares al cuadrado: {pares_cuadrados}")

    # 2. Dict comprehension
    cuadrados_dict = {f"num_{x}": x**2 for x in range(1, 6)}
    print(f"Diccionario mapeado: {cuadrados_dict}")

    # 3. Consumo de generador diferido
    print("Primeros 10 de Fibonacci:")
    for idx, num in enumerate(fibonacci_gen(10), 1):
        print(f"  F_{idx} = {num}")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: "python-decorators",
    title: "Python: Decoradores & LRU Cache",
    language: "python",
    category: "python-advanced",
    description: "Decorador de medición de tiempo con functools.wraps y memorización con lru_cache.",
    standard: "3.12",
    code: `import time
from functools import wraps, lru_cache

def timeit(func):
    """Decorador para medir tiempo de ejecución de una función."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = (time.perf_counter() - start) * 1000
        print(f"[{func.__name__}] tomó {duration:.4f} ms")
        return result
    return wrapper

@lru_cache(maxsize=128)
def fib_memo(n: int) -> int:
    if n <= 1:
        return n
    return fib_memo(n - 1) + fib_memo(n - 2)

@timeit
def calcular():
    print("Calculando Fibonacci(35) con lru_cache...")
    return fib_memo(35)

def main():
    res = calcular()
    print(f"Resultado: {res}")
    print(f"Info de caché: {fib_memo.cache_info()}")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: "python-pattern-matching",
    title: "Python 3.10+: Match / Case & Dataclasses",
    language: "python",
    category: "python-features",
    description: "Structural Pattern Matching moderno junto con dataclasses fuertemente tipadas.",
    standard: "3.12",
    code: `from dataclasses import dataclass
from typing import Union

@dataclass
class Circulo:
    radio: float

@dataclass
class Rectangulo:
    ancho: float
    alto: float

@dataclass
class Triangulo:
    base: float
    altura: float

Figura = Union[Circulo, Rectangulo, Triangulo]

def calcular_area(figura: Figura) -> float:
    # Pattern Matching estructural (Python 3.10+)
    match figura:
        case Circulo(radio=r) if r > 0:
            import math
            return math.pi * (r ** 2)
        case Rectangulo(ancho=w, alto=h):
            return w * h
        case Triangulo(base=b, altura=h):
            return 0.5 * b * h
        case _:
            raise ValueError(f"Figura desconocida o inválida: {figura}")

def main():
    figuras: list[Figura] = [
        Circulo(radio=5.0),
        Rectangulo(ancho=4.0, alto=6.0),
        Triangulo(base=3.0, altura=8.0),
    ]

    for f in figuras:
        area = calcular_area(f)
        print(f"Figura: {f.__class__.__name__:<11} => Área: {area:.2f}")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: "python-dsa-bfs",
    title: "Python DSA: BFS / Camino Más Corto",
    language: "python",
    category: "dsa",
    description: "Búsqueda en anchura con collections.deque para hallar distancias mínimas en grafos.",
    standard: "3.12",
    code: `from collections import deque

def bfs_camino_corto(grafo: dict[str, list[str]], inicio: str, destino: str) -> list[str] | None:
    if inicio == destino:
        return [inicio]

    cola = deque([[inicio]])
    visitados = {inicio}

    while cola:
        camino = cola.popleft()
        nodo_actual = camino[-1]

        for vecino in grafo.get(nodo_actual, []):
            if vecino not in visitados:
                visitados.add(vecino)
                nuevo_camino = camino + [vecino]
                if vecino == destino:
                    return nuevo_camino
                cola.append(nuevo_camino)

    return None

def main():
    red = {
        "A": ["B", "C"],
        "B": ["A", "D", "E"],
        "C": ["A", "F"],
        "D": ["B"],
        "E": ["B", "F", "G"],
        "F": ["C", "E", "G"],
        "G": ["E", "F"],
    }

    inicio, fin = "A", "G"
    camino = bfs_camino_corto(red, inicio, fin)
    print(f"Red de nodos: {list(red.keys())}")
    print(f"Camino más corto de '{inicio}' a '{fin}': {' -> '.join(camino) if camino else 'Inalcanzable'}")

if __name__ == "__main__":
    main()
`,
  },
  // HTML / CSS / JS All-in-one Templates
  {
    id: "html-canvas-particles",
    title: "HTML/CSS/JS: Canvas Particles & Physics",
    language: "html",
    category: "html-demos",
    description: "Animación de partículas interactiva con HTML5 Canvas, CSS moderno y bucle de renderizado requestAnimationFrame.",
    standard: "HTML5",
    code: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Canvas Partículas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #090b10;
      color: #fff;
      font-family: sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    #ui {
      position: absolute;
      top: 20px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 12px 20px;
      border-radius: 999px;
      font-size: 14px;
      color: #38bdf8;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="ui">Mueve el ratón o haz clic para interactuar</div>
  <canvas id="canvas"></canvas>

  <script>
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const mouse = { x: width / 2, y: height / 2 };

    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      for (let i = 0; i < 3; i++) createParticle(mouse.x, mouse.y);
    });

    window.addEventListener("click", (e) => {
      for (let i = 0; i < 25; i++) createParticle(e.clientX, e.clientY, true);
    });

    function createParticle(x, y, burst = false) {
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? Math.random() * 6 + 2 : Math.random() * 2 + 0.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        life: 1,
        decay: Math.random() * 0.02 + 0.01,
        hue: (Date.now() / 20) % 360,
      });
    }

    function animate() {
      ctx.fillStyle = "rgba(9, 11, 16, 0.2)";
      ctx.fillRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = \`hsla(\${p.hue}, 90%, 60%, \${p.life})\`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = \`hsla(\${p.hue}, 90%, 60%, 0.8)\`;
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    for (let i = 0; i < 40; i++) {
      createParticle(Math.random() * width, Math.random() * height);
    }
    animate();
    console.log("Canvas particle engine iniciado.");
  </script>
</body>
</html>`,
  },
  {
    id: "html-todo-app",
    title: "HTML/CSS/JS: App de Tareas Interactiva",
    language: "html",
    category: "html-demos",
    description: "Aplicación completa de tareas en un solo bloque con estilos CSS modernos y gestión de estado en JS.",
    standard: "HTML5",
    code: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Todo App</title>
  <style>
    :root {
      --bg: #0d1117;
      --card: #161b22;
      --border: #30363d;
      --accent: #238636;
      --accent-hover: #2ea043;
      --text: #f0f6fc;
      --subtext: #8b949e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 40px 16px;
    }
    .container {
      width: 100%;
      max-width: 480px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.5);
      height: fit-content;
    }
    h2 { font-size: 1.5rem; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
    .input-row { display: flex; gap: 8px; margin-bottom: 20px; }
    input[type="text"] {
      flex: 1;
      background: #0d1117;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 14px;
      color: var(--text);
      outline: none;
      font-size: 14px;
    }
    input[type="text"]:focus { border-color: #58a6ff; }
    button.add-btn {
      background: var(--accent);
      border: none;
      color: white;
      font-weight: 600;
      padding: 10px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
    button.add-btn:hover { background: var(--accent-hover); }
    ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #0d1117;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 14px;
    }
    li.done span { text-decoration: line-through; color: var(--subtext); }
    .del-btn {
      background: transparent;
      border: none;
      color: #f85149;
      cursor: pointer;
      font-weight: bold;
      padding: 4px 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>
      <span>Tareas Pendientes</span>
      <span id="counter" style="font-size: 13px; color: var(--subtext);">0 items</span>
    </h2>
    <div class="input-row">
      <input type="text" id="taskInput" placeholder="Añadir nueva tarea..." />
      <button class="add-btn" id="addBtn">Añadir</button>
    </div>
    <ul id="taskList"></ul>
  </div>

  <script>
    const input = document.getElementById("taskInput");
    const addBtn = document.getElementById("addBtn");
    const list = document.getElementById("taskList");
    const counter = document.getElementById("counter");

    let tasks = [
      { id: 1, text: "Aprender Next.js 16 y Turbopack", done: true },
      { id: 2, text: "Probar el editor HTML/CSS/JS", done: false },
    ];

    function render() {
      list.innerHTML = "";
      tasks.forEach((t) => {
        const li = document.createElement("li");
        if (t.done) li.classList.add("done");

        const span = document.createElement("span");
        span.textContent = t.text;
        span.style.cursor = "pointer";
        span.onclick = () => toggleTask(t.id);

        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "del-btn";
        btn.onclick = () => deleteTask(t.id);

        li.appendChild(span);
        li.appendChild(btn);
        list.appendChild(li);
      });
      counter.textContent = \`\${tasks.filter(t => !t.done).length} pendientes\`;
    }

    function addTask() {
      const val = input.value.trim();
      if (!val) return;
      tasks.push({ id: Date.now(), text: val, done: false });
      input.value = "";
      render();
      console.log("Nueva tarea agregada:", val);
    }

    function toggleTask(id) {
      tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
      render();
    }

    function deleteTask(id) {
      tasks = tasks.filter(t => t.id !== id);
      render();
    }

    addBtn.addEventListener("click", addTask);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });
    render();
  </script>
</body>
</html>`,
  },
  // Standalone JavaScript (Node.js) Templates
  {
    id: "js-async-pipeline",
    title: "JavaScript: Async / Await & Pipelines",
    language: "javascript",
    category: "js-basics",
    description: "Orquestación asíncrona avanzada con Promise.allSettled y control de concurrencia.",
    standard: "ES2023",
    code: `// Simulación de tareas asíncronas con temporizadores
function simularTarea(id, ms, debeFallar = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (debeFallar) {
        reject(new Error(\`Tarea \${id} falló intencionalmente tras \${ms}ms\`));
      } else {
        resolve({ id, status: "OK", duracion: \`\${ms}ms\` });
      }
    }, ms);
  });
}

async function main() {
  console.log("🚀 Iniciando pipeline asíncrono con Promise.allSettled...\\n");

  const tareas = [
    simularTarea("A", 120),
    simularTarea("B", 80),
    simularTarea("C", 200, true), // esta fallará
    simularTarea("D", 50),
  ];

  const resultados = await Promise.allSettled(tareas);

  resultados.forEach((res) => {
    if (res.status === "fulfilled") {
      console.log(\`✅ [Éxito] \${JSON.stringify(res.value)}\`);
    } else {
      console.log(\`❌ [Error]  \${res.reason.message}\`);
    }
  });

  const exitosas = resultados.filter(r => r.status === "fulfilled").length;
  console.log(\`\\nResumen: \${exitosas}/\${resultados.length} tareas completadas con éxito.\`);
}

main().catch(console.error);
`,
  },
  {
    id: "js-functional-stream",
    title: "JavaScript: Procesamiento Funcional de Datos",
    language: "javascript",
    category: "js-advanced",
    description: "Uso idiomático de Map, Filter, Reduce y Sets para análisis de transacciones.",
    standard: "ES2023",
    code: `const transacciones = [
  { id: 1, categoria: "Electrónica", monto: 120.5, cliente: "Ana" },
  { id: 2, categoria: "Libros", monto: 25.0, cliente: "Carlos" },
  { id: 3, categoria: "Electrónica", monto: 350.0, cliente: "Beatriz" },
  { id: 4, categoria: "Hogar", monto: 80.2, cliente: "Ana" },
  { id: 5, categoria: "Libros", monto: 45.0, cliente: "David" },
  { id: 6, categoria: "Electrónica", monto: 99.9, cliente: "Ana" },
];

function analizarVentas(datos) {
  const clientes = [...new Set(datos.map(t => t.cliente))];

  const porCategoria = datos.reduce((acc, { categoria, monto }) => {
    acc[categoria] = (acc[categoria] || 0) + monto;
    return acc;
  }, {});

  const gastoClientes = datos.reduce((acc, { cliente, monto }) => {
    acc[cliente] = (acc[cliente] || 0) + monto;
    return acc;
  }, {});

  return {
    totalGeneral: datos.reduce((sum, t) => sum + t.monto, 0),
    clientesUnicos: clientes.length,
    porCategoria,
    mayorComprador: Object.entries(gastoClientes).sort((a, b) => b[1] - a[1])[0],
  };
}

console.log("=== Reporte de Transacciones ===");
const informe = analizarVentas(transacciones);
console.log(JSON.stringify(informe, null, 2));
`,
  },
  // TypeScript Templates
  {
    id: "ts-discriminated-unions",
    title: "TypeScript: Uniones Discriminadas & Exhaustiveness",
    language: "typescript",
    category: "basics",
    description: "Modelado algebraico de tipos de dominio y comprobación exhaustiva con tipo never.",
    standard: "ESNext",
    code: `// Uniones discriminadas para modelar estados de pago
type MetodoPago =
  | { tipo: "tarjeta"; numero: string; titular: string; cvv: number }
  | { tipo: "paypal"; email: string }
  | { tipo: "crypto"; wallet: string; red: "ethereum" | "bitcoin" }
  | { tipo: "transferencia"; iban: string };

interface Transaccion {
  id: string;
  monto: number;
  moneda: "EUR" | "USD";
  pago: MetodoPago;
}

// Type guard para verificación exhaustiva en tiempo de compilación
function verificarInalcanzable(x: never): never {
  throw new Error(\`Caso no contemplado: \${JSON.stringify(x)}\`);
}

function procesarPago(tx: Transaccion): string {
  const { pago, monto, moneda } = tx;

  switch (pago.tipo) {
    case "tarjeta":
      return \`💳 Cobrando \${monto} \${moneda} a tarjeta ...\${pago.numero.slice(-4)}\`;
    case "paypal":
      return \`🅿️ Enviando solicitud PayPal a \${pago.email} (\${monto} \${moneda})\`;
    case "crypto":
      return \`⛓️ Emitiendo tx en red \${pago.red} hacia \${pago.wallet}\`;
    case "transferencia":
      return \`🏦 Orden de transferencia bancaria al IBAN \${pago.iban}\`;
    default:
      return verificarInalcanzable(pago);
  }
}

function main(): void {
  const transacciones: Transaccion[] = [
    {
      id: "tx-01",
      monto: 149.99,
      moneda: "EUR",
      pago: { tipo: "tarjeta", numero: "4532123456789012", titular: "Ana López", cvv: 123 },
    },
    {
      id: "tx-02",
      monto: 50.0,
      moneda: "USD",
      pago: { tipo: "paypal", email: "dev@typescript.org" },
    },
    {
      id: "tx-03",
      monto: 850.0,
      moneda: "EUR",
      pago: { tipo: "crypto", wallet: "0x71C...B29", red: "ethereum" },
    },
  ];

  console.log("=== Procesador de Pagos con Tipado Estático ===");
  transacciones.forEach((tx) => {
    console.log(procesarPago(tx));
  });
}

main();
`,
  },
  {
    id: "ts-generics-builder",
    title: "TypeScript: Generics & Fluent Builder Pattern",
    language: "typescript",
    category: "basics",
    description: "Patrón constructor fluido con tipos genéricos para creación inmutable y segura.",
    standard: "ESNext",
    code: `interface SolicitudHttp<TBody = unknown> {
  url: string;
  metodo: "GET" | "POST" | "PUT" | "DELETE";
  cabeceras: Record<string, string>;
  cuerpo?: TBody;
  timeoutMs: number;
}

class RequestBuilder<TBody = void> {
  private config: Partial<SolicitudHttp<TBody>> = {
    metodo: "GET",
    cabeceras: { "Accept": "application/json" },
    timeoutMs: 5000,
  };

  url(url: string): this {
    this.config.url = url;
    return this;
  }

  metodo(metodo: "GET" | "POST" | "PUT" | "DELETE"): this {
    this.config.metodo = metodo;
    return this;
  }

  cabecera(clave: string, valor: string): this {
    this.config.cabeceras = { ...this.config.cabeceras, [clave]: valor };
    return this;
  }

  cuerpo<B>(cuerpo: B): RequestBuilder<B> {
    const nuevo = new RequestBuilder<B>();
    nuevo.config = {
      ...this.config,
      cuerpo,
    } as unknown as Partial<SolicitudHttp<B>>;
    return nuevo;
  }

  build(): SolicitudHttp<TBody> {
    if (!this.config.url) {
      throw new Error("La URL es obligatoria.");
    }
    return this.config as SolicitudHttp<TBody>;
  }
}

interface PayloadUsuario {
  nombre: string;
  correo: string;
  activo: boolean;
}

function main(): void {
  const req = new RequestBuilder()
    .url("https://api.ejemplo.com/v1/usuarios")
    .metodo("POST")
    .cabecera("Authorization", "Bearer token_secreto_xyz")
    .cuerpo<PayloadUsuario>({
      nombre: "Ada Lovelace",
      correo: "ada@computacion.com",
      activo: true,
    })
    .build();

  console.log("Solicitud HTTP fuertemente tipada creada:");
  console.log(JSON.stringify(req, null, 2));
}

main();
`,
  },
];
