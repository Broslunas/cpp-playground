import { CodeTemplate } from "@/types";

export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: "hello-world",
    title: "Hola Mundo & I/O Básico",
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
];
