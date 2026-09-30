# C++ Playground

Un entorno de desarrollo interactivo y moderno para C++ en la web, construido con **Next.js 14**, **TypeScript**, **Tailwind CSS** y **CodeMirror 6**, con backend impulsado por **Wandbox API**.

## Características

- ⚡ **Compilación y Ejecución Remota**: Compila y ejecuta código C++ moderno (desde C++11 hasta C++23) en milisegundos con GCC y Clang.
- ⌨️ **Soporte Completo de I/O**:
  - `stdin`: Ingresa datos estándar para programas con `std::cin` o `getline`.
  - `stdout`: Visualización en tiempo real de salidas del programa.
  - `stderr`: Mensajes y errores de ejecución con formato y colores dedicados.
  - **Compiler Logs**: Advertencias y logs del compilador.
- 💾 **Persistencia Local**: Tus proyectos y snippets se guardan automáticamente en tu navegador usando `localStorage`. Crea, renombra, elimina y descarga archivos `.cc`.
- 🛡️ **Rate Limiting**: Protección en el servidor por IP (15 peticiones por minuto) con cabeceras `Retry-After` para evitar saturación.
- ♿ **100% Accesible (WCAG 2.1 AA)**:
  - Enlaces de salto ("Skip to content").
  - Anuncio en vivo para lectores de pantalla (`aria-live="polite"`).
  - Navegación completa por teclado con atajos (`Ctrl + Enter` para compilar).
  - Alto contraste y anillos de foco visibles (`focus-visible`).
- 🎨 **Estética Minimalista Oscura**: Diseño estilo terminal hacker con acentos verde neón (`#00ff88`) y cian (`#00d4ff`).

## Cómo Iniciar

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Compilar para producción
npm run build
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

- `src/app/page.tsx`: Landing page en español con presentación, características y showcase de código.
- `src/app/playground/page.tsx`: Interfaz del playground con editor, paneles y persistencia.
- `src/app/api/compile/route.ts`: Endpoint proxy seguro con rate limiting y conexión a Wandbox.
- `src/components/playground/Editor.tsx`: Editor basado en CodeMirror 6 con resaltado sintáctico de C++.
- `src/components/playground/ProjectSidebar.tsx`: Gestión de proyectos locales (crear, renombrar, eliminar, exportar `.cc`).
- `src/lib/rate-limit.ts`: Implementación de limitación de tasa por IP.
- `src/lib/projects.ts`: CRUD de almacenamiento local con sincronización y autosave.
