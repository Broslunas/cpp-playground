# Ejecuta.tech

Playground interactivo y moderno de compilación y ejecución de código en la web. Desarrollado con **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS** y **CodeMirror 6**, con backend impulsado por **Wandbox API**, persistencia en **MongoDB** y almacenamiento en **Cloudflare R2**.

---

## Características

- ⚡ **Multi-lenguaje**:
  - **Compilados e interpretados**: C++, C, Python, JavaScript, TypeScript, Bash, SQL (vía Wandbox API).
  - **Web Frontend**: HTML/CSS/JS con vista previa en vivo y renderizado seguro en iframe.
  - **Terminal Interactiva**: Soporte para comandos y flujos interactivos.
- ⚙️ **Control de Compilador**:
  - Niveles de optimización (`-O0`, `-O1`, `-O2`, `-O3`, `-Os`, `-Ofast`).
  - Sanitizers (`AddressSanitizer`, `UndefinedBehaviorSanitizer`, `LeakSanitizer`, `ThreadSanitizer`).
  - Flags de advertencia (`-Wall`, `-Wextra`, `-Wpedantic`, `-Werror`) y flags personalizados.
- ⌨️ **Manejo de I/O**:
  - Panel dedicado para `stdin`.
  - Visualización independiente de `stdout`, `stderr` y logs del compilador.
- 🔐 **Autenticación y Seguridad**:
  - **Passkeys (FIDO2 / WebAuthn)**: Inicio de sesión biométrico sin contraseña.
  - **OAuth**: Autenticación con GitHub.
  - **2FA / TOTP**: Autenticación de doble factor con códigos QR.
  - Sesiones seguras firmadas con JWT (`jose`).
  - Rate limiting por IP en endpoints de compilación y autenticación.
- ☁️ **Persistencia Híbrida**:
  - **Local**: Guardado automático en `localStorage` con soporte offline.
  - **Cloud**: Sincronización en la nube con MongoDB y almacenamiento de código en Cloudflare R2.
- 🔗 **Compartición y Comunidad**:
  - Enlaces cortos compartibles (`/s/[code]`).
  - Protección opcional de snippets mediante contraseña.
  - Perfiles públicos de usuario (`/u/[username]`) con proyectos destacados y visibilidad granular (privado, no listado, público).
- 📐 **Espacio de Trabajo Adaptable**:
  - Distribuciones predefinidas (Estándar, Dos columnas, Columnas, Vertical) y editor de layout personalizado.
  - Atajos de teclado configurables (`Ctrl + Enter` para compilar, formateo de código, etc.).
  - 100% accesible (WCAG 2.1 AA) con navegación por teclado y soporte para lectores de pantalla.

---

## Requisitos

- Node.js 20+
- npm, pnpm o yarn
- Instancia de MongoDB (opcional para desarrollo local sin sincronización cloud)
- Cuenta de Cloudflare R2 o compatible con S3 (opcional para guardado cloud)

---

## Variables de Entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL base de la aplicación (ej. `http://localhost:3000`) |
| `SESSION_SECRET` | Clave secreta (mínimo 32 caracteres) para firmar tokens JWT |
| `GITHUB_CLIENT_ID` | Client ID de la GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | Client Secret de la GitHub OAuth App |
| `MONGODB_URI` | URI de conexión a MongoDB |
| `R2_ACCOUNT_ID` | Cloudflare Account ID para R2 |
| `R2_ACCESS_KEY_ID` | Access Key ID del token de R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key del token de R2 |
| `R2_BUCKET_NAME` | Nombre del bucket R2 |

---

## Instalación y Uso

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar en producción
npm start

# Ejecutar linter
npm run lint
```

Visita [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Estructura del Código

```text
src/
├── app/                  # App Router (páginas, layouts y API routes)
│   ├── api/              # Endpoints (compile, auth, projects, share, users)
│   ├── [language]/       # Rutas dinámicas por lenguaje y proyecto
│   ├── playground/       # Espacio principal del editor
│   ├── s/[code]/         # Visualización de código compartido
│   └── u/[username]/     # Perfiles públicos de usuario
├── components/           # Componentes modulares
│   ├── account/          # Vistas y paneles de cuenta
│   ├── auth/             # Componentes de sesión y login
│   ├── landing/          # Sección pública y landing page
│   ├── playground/       # Editor, terminal, paneles, layouts y modales
│   └── ui/               # Botones, QR, skip links y utilidades accesibles
├── lib/                  # Lógica de negocio y librerías auxiliares
│   ├── auth.ts           # Manejo de sesiones y tokens
│   ├── cloud-projects.ts # Operaciones CRUD en la nube
│   ├── compiler.ts       # Integración con Wandbox API
│   ├── languages.ts      # Definición de lenguajes, compiladores y plantillas
│   ├── mongodb.ts        # Cliente de conexión a base de datos
│   ├── r2.ts             # Cliente de almacenamiento Cloudflare R2
│   ├── rate-limit.ts     # Control de flujo por IP
│   └── webauthn.ts       # Soporte de Passkeys
└── types/                # Definiciones de TypeScript
```

---

## Licencia

Privado / Propietario.
