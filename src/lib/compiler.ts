import { CompilerOption } from "@/types";

export const AVAILABLE_COMPILERS: CompilerOption[] = [
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
];

export const DEFAULT_CODE = `#include <iostream>
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
