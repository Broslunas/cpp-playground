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
];
