"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Terminal,
  Maximize2,
  Minimize2,
  Trash2,
  RotateCcw,
  Plus,
  FolderOpen,
  Save,
  Check,
  Download,
  X,
  Play,
  Copy,
} from "lucide-react";

export interface FileSystemNode {
  type: "file" | "dir";
  content?: string;
  permissions?: string;
  updatedAt?: string;
  children?: Record<string, FileSystemNode>;
}

export interface TerminalSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  fs: Record<string, FileSystemNode>;
  currentDir: string;
  commandHistory: string[];
  env: Record<string, string>;
}

interface HistoryEntry {
  command: string;
  output: string;
  directory: string;
  isError?: boolean;
}

const DEFAULT_FS: Record<string, FileSystemNode> = {
  home: {
    type: "dir",
    permissions: "rwxr-xr-x",
    children: {
      user: {
        type: "dir",
        permissions: "rwxr-xr-x",
        children: {
          "bienvenida.txt": {
            type: "file",
            permissions: "rw-r--r--",
            content: `=====================================================
  SIMULADOR DE TERMINAL LINUX UBUNTU INTERACTIVO
=====================================================
- Gestiona proyectos y sesiones independientes arriba.
- Editor nano interactivo integrado: 'nano script.sh'
- Comandos soportados:
  * Archivos: ls, cd, pwd, cat, nano, touch, mkdir, rm, cp, mv, tree, chmod, stat
  * Texto: grep, find, wc, head, tail, sort, uniq, diff, base64, md5sum
  * Sistema: uname, whoami, hostname, date, uptime, free, df, du, top, ps, kill
  * Red: ip, ifconfig, ping, curl
  * Herramientas: neofetch, lscpu, lsblk, dmesg, cal, bc, history, export, env
  * Redirección & Pipes: 'cat file.txt | grep algo', 'echo "hola" > file.txt'
  * Ejecución Real: cualquier script bash se ejecuta en el contenedor Linux de Ubuntu.
=====================================================`,
          },
          "script.sh": {
            type: "file",
            permissions: "rwxr-xr-x",
            content: `#!/usr/bin/env bash
# Script de bienvenida y diagnóstico
echo "Iniciando diagnóstico del sistema..."
echo "Kernel: $(uname -s -r -m)"
echo "Usuario actual: $(whoami)"
echo "Fecha y hora: $(date)"
echo "Espacio en disco:"
df -h
echo "Listo."`,
          },
          proyectos: {
            type: "dir",
            permissions: "rwxr-xr-x",
            children: {
              "app.py": {
                type: "file",
                permissions: "rw-r--r--",
                content: `import sys\nprint(f"Hola desde Python en Ubuntu {sys.version}")`,
              },
              "servidor.sh": {
                type: "file",
                permissions: "rwxr-xr-x",
                content: `#!/bin/bash\necho "Iniciando servicio mock en puerto 8080..."\nsleep 1\necho "Servidor escuchando en http://127.0.0.1:8080"`,
              },
            },
          },
          notas: {
            type: "dir",
            permissions: "rwxr-xr-x",
            children: {
              "tareas.md": {
                type: "file",
                permissions: "rw-r--r--",
                content: `- [x] Explorar árbol de directorios con 'tree'\n- [ ] Editar script con 'nano script.sh'\n- [ ] Probar tuberías con 'cat bienvenida.txt | grep nano'\n- [ ] Monitorizar procesos con 'top'`,
              },
            },
          },
        },
      },
    },
  },
  etc: {
    type: "dir",
    permissions: "rwxr-xr-x",
    children: {
      "os-release": {
        type: "file",
        permissions: "r--r--r--",
        content: `NAME="Ubuntu"\nVERSION="24.04 LTS (Noble Numbat)"\nID=ubuntu\nID_LIKE=debian\nPRETTY_NAME="Ubuntu 24.04 LTS"\nVERSION_ID="24.04"\nHOME_URL="https://www.ubuntu.com/"\nSUPPORT_URL="https://help.ubuntu.com/"`,
      },
      hostname: {
        type: "file",
        permissions: "rw-r--r--",
        content: "ubuntu-sandbox\n",
      },
      hosts: {
        type: "file",
        permissions: "rw-r--r--",
        content: "127.0.0.1\tlocalhost\n127.0.1.1\tubuntu-sandbox\n::1\t\tip6-localhost ip6-loopback",
      },
      passwd: {
        type: "file",
        permissions: "rw-r--r--",
        content: "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nuser:x:1000:1000:Ubuntu User,,,:/home/user:/bin/bash",
      },
    },
  },
  var: {
    type: "dir",
    permissions: "rwxr-xr-x",
    children: {
      log: {
        type: "dir",
        permissions: "rwxr-xr-x",
        children: {
          syslog: {
            type: "file",
            permissions: "rw-r-----",
            content: `Sep 30 21:00:01 ubuntu-sandbox systemd[1]: Starting Daily apt download activities...
Sep 30 21:00:02 ubuntu-sandbox systemd[1]: apt-daily.service: Deactivated successfully.
Sep 30 21:00:05 ubuntu-sandbox kernel: [    0.000000] Linux version 6.8.0-137-generic (buildd@canonical)
Sep 30 21:00:05 ubuntu-sandbox kernel: [    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.8.0-137 root=UUID=8d61 rw quiet splash`,
          },
        },
      },
    },
  },
};

const NEOFETCH_ART = `       _,met$$$$$gg.          broslunas@ejecuta.tech-sandbox
    ,g$$$$$$$$$$$$$$$P.       -------------------
  ,g$$P"        """Y$$.".     OS: Ubuntu 24.04 LTS x86_64
 ,$$P'              \`$$$.    Host: Cloud Sandbox Environment
',$$P       ,ggs.     \`$$b:  Kernel: 6.8.0-137-generic
\`d$$'     ,$P"'   .    $$$   Uptime: 1 hour, 15 mins
 $$P      d$'     ,    $$P   Packages: 1042 (dpkg)
 $$:      $$.   -    ,d$$'   Shell: GNU bash 5.2.21
 $$;      Y$b._   _,d$P'     Terminal: web-xterm / Linux Virtual
 Y$$.    \`."Y$$$$P"'         CPU: AMD EPYC 7763 (4 Cores) @ 2.45GHz
 \`$$b      "-.__             Memory: 1240MiB / 4096MiB
  \`Y$$                        Disk: 6.2GB / 32GB (19%)
   \`$$b.
     \`Y$$b.
        \`"Y$b._
            \`"""`;

const STORAGE_KEY = "linux_terminal_sessions_v2";

export function LinuxTerminalWorkspace() {
  // Session management state
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");

  // Terminal active state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const [currentDir, setCurrentDir] = useState("/home/user");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [fs, setFs] = useState<Record<string, FileSystemNode>>(DEFAULT_FS);
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    SHELL: "/bin/bash",
    USER: "user",
    HOME: "/home/user",
    PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    TERM: "xterm-256color",
    LANG: "es_ES.UTF-8",
  });

  // Interactive Nano editor state
  const [isNanoOpen, setIsNanoOpen] = useState(false);
  const [nanoFilePath, setNanoFilePath] = useState("");
  const [nanoContent, setNanoContent] = useState("");
  const [nanoStatus, setNanoStatus] = useState("");

  // Interactive Top monitor state
  const [isTopOpen, setIsTopOpen] = useState(false);
  const [topUptimeSeconds, setTopUptimeSeconds] = useState(3600);

  // General terminal state
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nanoTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or load sessions
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TerminalSession[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          setFs(parsed[0].fs || DEFAULT_FS);
          setCurrentDir(parsed[0].currentDir || "/home/user");
          setCommandHistory(parsed[0].commandHistory || []);
          if (parsed[0].env) setEnvVars(parsed[0].env);
          return;
        }
      }
    } catch (e) {
      console.error("Error loading sessions", e);
    }

    // Default primary session
    const defaultSession: TerminalSession = {
      id: "session-" + Date.now(),
      name: "Ubuntu Lab Principal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fs: DEFAULT_FS,
      currentDir: "/home/user",
      commandHistory: [],
      env: {
        SHELL: "/bin/bash",
        USER: "user",
        HOME: "/home/user",
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        TERM: "xterm-256color",
        LANG: "es_ES.UTF-8",
      },
    };

    setSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
  }, []);

  // Save active session on changes
  useEffect(() => {
    if (!activeSessionId || sessions.length === 0) return;

    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            fs,
            currentDir,
            commandHistory,
            env: envVars,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Error saving terminal sessions", err);
      }
      return updated;
    });
  }, [fs, currentDir, commandHistory, envVars, activeSessionId]);

  // Focus management
  const focusInput = () => {
    if (!isNanoOpen && !isTopOpen) {
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isExecuting]);

  // Timer for top process monitor
  useEffect(() => {
    if (!isTopOpen) return;
    const interval = setInterval(() => {
      setTopUptimeSeconds((prev) => prev + 2);
    }, 2000);
    return () => clearInterval(interval);
  }, [isTopOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Switch session
  const switchSession = (targetId: string) => {
    const target = sessions.find((s) => s.id === targetId);
    if (!target) return;
    setActiveSessionId(target.id);
    setFs(target.fs || DEFAULT_FS);
    setCurrentDir(target.currentDir || "/home/user");
    setCommandHistory(target.commandHistory || []);
    if (target.env) setEnvVars(target.env);
    setHistory((prev) => [
      ...prev,
      {
        command: `# Sesión cambiada a: [${target.name}]`,
        output: "",
        directory: target.currentDir,
      },
    ]);
    setIsSessionsOpen(false);
    showToast(`Sesión activa: ${target.name}`);
  };

  // Create new session
  const handleCreateSession = (name?: string) => {
    const sessionTitle =
      name?.trim() || newSessionName.trim() || `Sesión ${sessions.length + 1}`;
    const newSession: TerminalSession = {
      id: "session-" + Date.now(),
      name: sessionTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fs: JSON.parse(JSON.stringify(DEFAULT_FS)),
      currentDir: "/home/user",
      commandHistory: [],
      env: { ...envVars },
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    setFs(newSession.fs);
    setCurrentDir("/home/user");
    setCommandHistory([]);
    setHistory([]);
    setNewSessionName("");
    setIsSessionsOpen(false);
    showToast(`Nueva sesión creada: ${sessionTitle}`);
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      showToast("No puedes eliminar la única sesión existente");
      return;
    }
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      switchSession(remaining[0].id);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch {}
    showToast("Sesión eliminada");
  };

  // Export current session as JSON
  const handleExportSession = () => {
    const active = sessions.find((s) => s.id === activeSessionId);
    if (!active) return;
    const blob = new Blob([JSON.stringify(active, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.name.toLowerCase().replace(/\s+/g, "_")}_linux_session.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Sesión exportada correctamente");
  };

  // Helper to resolve paths in the virtual filesystem
  const resolveNode = (
    pathStr: string,
    currentFileSystem = fs
  ): {
    node: FileSystemNode | null;
    parent: FileSystemNode | null;
    name: string;
    fullPath: string;
  } => {
    let clean = pathStr.trim();
    if (clean === "~") clean = "/home/user";
    if (clean.startsWith("~/")) clean = "/home/user/" + clean.slice(2);

    const fullPath = clean.startsWith("/")
      ? clean
      : `${currentDir === "/" ? "" : currentDir}/${clean}`;

    const parts = fullPath.split("/").filter(Boolean);
    const resolvedParts: string[] = [];
    for (const p of parts) {
      if (p === ".") continue;
      if (p === "..") {
        resolvedParts.pop();
      } else {
        resolvedParts.push(p);
      }
    }

    let curr: FileSystemNode = { type: "dir", children: currentFileSystem };
    let parent: FileSystemNode | null = null;
    let name = "";

    for (let i = 0; i < resolvedParts.length; i++) {
      const part = resolvedParts[i];
      if (!curr.children || !curr.children[part]) {
        return {
          node: null,
          parent: curr,
          name: part,
          fullPath: `/${resolvedParts.join("/")}`,
        };
      }
      parent = curr;
      name = part;
      curr = curr.children[part];
    }

    return {
      node: curr,
      parent,
      name,
      fullPath: resolvedParts.length === 0 ? "/" : `/${resolvedParts.join("/")}`,
    };
  };

  // Save file content in VFS
  const saveFileToFs = (path: string, content: string) => {
    const { fullPath } = resolveNode(path);
    const parts = fullPath.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) return false;

    setFs((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      let curr = copy;
      for (const p of parts) {
        if (!curr[p]) curr[p] = { type: "dir", children: {} };
        if (!curr[p].children) curr[p].children = {};
        curr = curr[p].children;
      }
      curr[fileName] = {
        type: "file",
        content,
        permissions: curr[fileName]?.permissions || "rw-r--r--",
        updatedAt: new Date().toISOString(),
      };
      return copy;
    });
    return true;
  };

  // Tree generator helper
  const renderTree = (node: FileSystemNode, prefix = ""): string[] => {
    if (node.type !== "dir" || !node.children) return [];
    const entries = Object.entries(node.children);
    const lines: string[] = [];

    entries.forEach(([name, child], idx) => {
      const isLast = idx === entries.length - 1;
      const branch = isLast ? "└── " : "├── ";
      lines.push(`${prefix}${branch}${name}${child.type === "dir" ? "/" : ""}`);
      if (child.type === "dir") {
        const nextPrefix = prefix + (isLast ? "    " : "│   ");
        lines.push(...renderTree(child, nextPrefix));
      }
    });

    return lines;
  };

  // Execute terminal pipeline or single command
  const handleCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) {
      setHistory((prev) => [
        ...prev,
        { command: "", output: "", directory: currentDir },
      ]);
      return;
    }

    // Add to navigation history
    setCommandHistory((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)]);
    setHistoryIndex(-1);

    // Variable expansion ($VAR)
    let expandedCmd = trimmed;
    Object.entries(envVars).forEach(([k, v]) => {
      expandedCmd = expandedCmd.replaceAll(`$${k}`, v);
    });

    // Check for redirection: > or >>
    const redirectAppendMatch = expandedCmd.match(/(.+?)\s*>>\s*([^\s|]+)$/);
    const redirectOverwriteMatch = expandedCmd.match(/(.+?)\s*>\s*([^\s|]+)$/);

    if (redirectAppendMatch || redirectOverwriteMatch) {
      const isAppend = Boolean(redirectAppendMatch);
      const match = isAppend ? redirectAppendMatch : redirectOverwriteMatch;
      if (match) {
        const subCommand = match[1].trim();
        const targetFile = match[2].trim();
        const out = await executeSingleCommand(subCommand);

        const { node } = resolveNode(targetFile);
        const existing = node && node.type === "file" ? node.content || "" : "";
        const newContent = isAppend
          ? existing + (existing.endsWith("\n") || !existing ? "" : "\n") + out.output + "\n"
          : out.output + "\n";

        saveFileToFs(targetFile, newContent);
        setHistory((prev) => [
          ...prev,
          {
            command: rawCmd,
            output: "",
            directory: currentDir,
            isError: out.isError,
          },
        ]);
        return;
      }
    }

    // Check for pipe: |
    if (expandedCmd.includes("|")) {
      const stages = expandedCmd.split("|").map((s) => s.trim());
      let pipelineInput = "";
      let hasError = false;

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const res = await executeSingleCommand(stage, pipelineInput);
        pipelineInput = res.output;
        if (res.isError) {
          hasError = true;
          break;
        }
      }

      setHistory((prev) => [
        ...prev,
        {
          command: rawCmd,
          output: pipelineInput.trimEnd(),
          directory: currentDir,
          isError: hasError,
        },
      ]);
      return;
    }

    // Single command execution
    const result = await executeSingleCommand(expandedCmd);
    if (result.bypassHistory) return;

    setHistory((prev) => [
      ...prev,
      {
        command: rawCmd,
        output: result.output.trimEnd(),
        directory: currentDir,
        isError: result.isError,
      },
    ]);
  };

  // Internal single command processor
  const executeSingleCommand = async (
    cmdLine: string,
    pipedStdin?: string
  ): Promise<{ output: string; isError?: boolean; bypassHistory?: boolean }> => {
    const tokens = cmdLine.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const sanitizedTokens = tokens.map((t) => t.replace(/^"|"$/g, ""));
    const [cmd, ...args] = sanitizedTokens;

    if (!cmd) return { output: "" };

    switch (cmd.toLowerCase()) {
      case "clear":
        setHistory([]);
        return { output: "", bypassHistory: true };

      case "help":
        return {
          output: `GNU Bash, versión 5.2.21(1)-release (x86_64-pc-linux-gnu)
========================================================================
COMANDOS DE ARCHIVOS Y NAVEGACIÓN:
  ls [-la|-lh|-R] [ruta]     Listar archivos y carpetas
  cd <dir>                   Cambiar directorio actual
  pwd                        Mostrar directorio de trabajo
  tree [ruta]                Árbol jerárquico de directorios
  cat [archivo]              Mostrar contenido de archivo(s)
  nano <archivo>             Abrir editor de texto GNU nano interactivo
  touch <archivo>            Crear archivo vacío o actualizar timestamp
  mkdir [-p] <dir>           Crear nuevo directorio
  rm [-r|-f] <objetivo>      Eliminar archivo o directorio
  cp [-r] <origen> <dest>    Copiar archivo o carpeta
  mv <origen> <dest>         Mover o renombrar archivo/carpeta
  chmod <perm> <archivo>     Cambiar permisos (+x, 755, 644)
  stat <archivo>             Metadatos detallados de inodo y permisos

HERRAMIENTAS DE TEXTO Y PROCESAMIENTO:
  grep [-i|-v|-n] <patrón>   Buscar coincidencias de texto
  find <dir> [-name patrón]  Buscar archivos por nombre
  wc [-l|-w|-c] [archivo]    Contar líneas, palabras y caracteres
  head [-n N] [archivo]      Primeras N líneas
  tail [-n N] [archivo]      Últimas N líneas
  sort [-r|-n] [archivo]     Ordenar líneas alfabética o numéricamente
  uniq [-c] [archivo]        Filtrar líneas duplicadas adyacentes
  diff <file1> <file2>       Comparar diferencias entre dos archivos
  base64 [-d] [texto]        Codificar / decodificar Base64
  md5sum / sha256sum         Calcular checksums criptográficos

SISTEMA, PROCESOS Y HARDWARE:
  uname [-a|-r|-m]           Información del kernel Linux
  whoami / id / hostname     Identidad del usuario y máquina
  date / uptime / cal        Fecha, tiempo de encendido y calendario
  top / htop                 Monitor interactivo de procesos del sistema
  ps [aux]                   Listado de procesos en ejecución
  kill <pid>                 Terminar un proceso por PID
  free [-m|-h]               Uso de memoria RAM y Swap
  df [-h] / du [-sh] [dir]   Uso y espacio de almacenamiento
  lscpu / lsblk / dmesg      Hardware CPU, discos y logs del kernel
  neofetch / fastfetch       Ficha gráfica y especificaciones de Ubuntu

RED Y COMUNICACIONES:
  ip a / ifconfig            Configuración de interfaces de red
  ping [-c N] <host>         Enviar paquetes ICMP de latencia
  curl [-I|-s] <url>         Peticiones HTTP cliente

SHELL Y VARIABLES:
  export VAR=valor           Definir variable de entorno
  env                        Listar variables del entorno
  history                    Historial de comandos ejecutados
  echo [texto]               Imprimir texto o variables ($VAR)
  bc <expresión>             Calculadora matemática en consola
  session <list|new|switch>  Administrar proyectos y sesiones

REDICCIÓN Y TUBERÍAS:
  cmd > archivo              Sobrescribir salida a archivo
  cmd >> archivo             Añadir salida al final del archivo
  cmd1 | cmd2                Encadenar salida como entrada del siguiente`,
        };

      case "session":
      case "proyecto":
      case "proyectos": {
        const sub = args[0]?.toLowerCase();
        if (sub === "new" || sub === "crear") {
          const name = args.slice(1).join(" ") || `Sesión ${sessions.length + 1}`;
          handleCreateSession(name);
          return { output: `[OK] Nueva sesión creada: ${name}` };
        }
        if (sub === "list" || sub === "ls") {
          const list = sessions
            .map(
              (s) =>
                `  ${s.id === activeSessionId ? "*" : " "} [${s.name}] (id: ${s.id}) - Creada: ${new Date(s.createdAt).toLocaleDateString()}`
            )
            .join("\n");
          return { output: `Sesiones disponibles:\n${list}` };
        }
        if (sub === "switch" || sub === "cambiar") {
          const query = args.slice(1).join(" ");
          const found = sessions.find(
            (s) =>
              s.name.toLowerCase().includes(query.toLowerCase()) || s.id === query
          );
          if (found) {
            switchSession(found.id);
            return { output: `[OK] Cambiado a sesión: ${found.name}` };
          }
          return {
            output: `session: no se encontró la sesión "${query}". Usa 'session list'`,
            isError: true,
          };
        }
        return {
          output: `Uso: session <list | new [nombre] | switch [nombre]>`,
        };
      }

      case "nano":
      case "vi":
      case "vim": {
        if (args.length === 0) {
          return {
            output: `${cmd}: falta el nombre del archivo para editar. Ej: nano script.sh`,
            isError: true,
          };
        }
        const targetPath = args[0];
        const { node } = resolveNode(targetPath);
        const existingContent =
          node && node.type === "file" ? node.content || "" : "";
        setNanoFilePath(targetPath);
        setNanoContent(existingContent);
        setNanoStatus(`[ Archivo: ${targetPath} - ${existingContent.length} caracteres ]`);
        setIsNanoOpen(true);
        setTimeout(() => nanoTextareaRef.current?.focus(), 50);
        return { output: "", bypassHistory: true };
      }

      case "top":
      case "htop":
        setIsTopOpen(true);
        return { output: "", bypassHistory: true };

      case "pwd":
        return { output: currentDir };

      case "whoami":
        return { output: envVars.USER || "user" };

      case "hostname":
        return { output: "ubuntu-sandbox" };

      case "id":
        return {
          output:
            "uid=1000(user) gid=1000(user) groups=1000(user),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),110(lxd)",
        };

      case "date":
        return { output: new Date().toUTCString() };

      case "uptime":
        return {
          output: ` 21:15:32 up 1:15,  1 user,  load average: 0.04, 0.02, 0.00`,
        };

      case "cal": {
        const d = new Date();
        const monthNames = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
        ];
        return {
          output: `     ${monthNames[d.getMonth()]} ${d.getFullYear()}
do lu ma mi ju vi sá
          1  2  3  4
 5  6  7  8  9 10 11
12 13 14 15 16 17 18
19 20 21 22 23 24 25
26 27 28 29 30`,
        };
      }

      case "bc":
      case "expr": {
        const expr = args.join(" ") || pipedStdin || "";
        try {
          // Safe math evaluator for basic arithmetic
          const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, "");
          const evaluated = Function(`"use strict"; return (${sanitized});`)();
          return { output: String(evaluated) };
        } catch {
          return { output: `bc: syntax error en '${expr}'`, isError: true };
        }
      }

      case "export": {
        if (args.length === 0) {
          const list = Object.entries(envVars)
            .map(([k, v]) => `declare -x ${k}="${v}"`)
            .join("\n");
          return { output: list };
        }
        const assign = args[0];
        const [k, ...rest] = assign.split("=");
        if (k && rest.length > 0) {
          const val = rest.join("=").replace(/^["']|["']$/g, "");
          setEnvVars((prev) => ({ ...prev, [k]: val }));
          return { output: "" };
        }
        return { output: "export: sintaxis inválida. Uso: export VAR=VALOR" };
      }

      case "env": {
        const lines = Object.entries(envVars)
          .map(([k, v]) => `${k}=${v}`)
          .join("\n");
        return { output: `${lines}\nPWD=${currentDir}` };
      }

      case "uname": {
        if (args.includes("-a") || args.length === 0) {
          return {
            output:
              "Linux ubuntu-sandbox 6.8.0-137-generic #137-Ubuntu SMP PREEMPT_DYNAMIC Fri Jul 17 20:28:23 UTC 2026 x86_64 GNU/Linux",
          };
        }
        if (args.includes("-r")) return { output: "6.8.0-137-generic" };
        if (args.includes("-m")) return { output: "x86_64" };
        if (args.includes("-s")) return { output: "Linux" };
        return { output: "Linux" };
      }

      case "free":
        return {
          output: `               total        used        free      shared  buff/cache   available
Mem:            3.8Gi       1.2Gi       1.6Gi        28Mi       1.0Gi       2.5Gi
Swap:           2.0Gi          0B       2.0Gi`,
        };

      case "df":
        return {
          output: `Filesystem     1K-blocks      Used Available Use% Mounted on
overlay         31457280   6291456  25165824  20% /
tmpfs              65536         0     65536   0% /dev
shm                65536         0     65536   0% /dev/shm
/dev/sda1       31457280   6291456  25165824  20% /home`,
        };

      case "du": {
        const target = args.find((a) => !a.startsWith("-")) || currentDir;
        return {
          output: `4.0K\t${target}/notas\n8.0K\t${target}/proyectos\n24K\t${target}`,
        };
      }

      case "neofetch":
      case "fastfetch":
        return { output: NEOFETCH_ART };

      case "lscpu":
        return {
          output: `Architecture:                    x86_64
CPU op-mode(s):                  32-bit, 64-bit
Address sizes:                   48 bits physical, 48 bits virtual
Byte Order:                      Little Endian
CPU(s):                          4
On-line CPU(s) list:             0-3
Vendor ID:                       AuthenticAMD
Model name:                      AMD EPYC 7763 64-Core Processor
Virtualization features:         AMD-V, KVM
L1d cache:                       128 KiB (4 instances)
L1i cache:                       128 KiB (4 instances)
L2 cache:                        2 MiB (4 instances)
L3 cache:                        32 MiB (1 instance)`,
        };

      case "lsblk":
        return {
          output: `NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0   32G  0 disk
├─sda1   8:1    0   30G  0 part /
└─sda2   8:2    0    2G  0 part [SWAP]`,
        };

      case "dmesg":
        return {
          output: `[    0.000000] Linux version 6.8.0-137-generic (buildd@canonical)
[    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=UUID=8d61 rw quiet
[    0.000000] KERNEL supported cpus: AMD, Intel
[    0.002140] ACPI: Core revision 20230628
[    0.145020] Memory: 4096000K/4194304K available
[    0.350110] Freeing unused kernel image (initmem) memory: 2840K
[    0.920040] systemd[1]: Inserted module 'autofs4'
[    1.250100] systemd[1]: Mounted Configuration File System.
[    2.050410] eth0: Link is Up - 10Gbps/Full - flow control rx/tx`,
        };

      case "ps": {
        const isAux = args.some((a) => a.includes("aux") || a.includes("ef"));
        if (isAux) {
          return {
            output: `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.2 169388 12892 ?        Ss   20:00   0:02 /sbin/init
root       240  0.0  0.1  25840  5210 ?        Ss   20:00   0:00 /lib/systemd/systemd-journald
root       310  0.0  0.1  14210  4100 ?        Ss   20:00   0:00 /usr/sbin/cron -f
user       501  0.0  0.1  18420  5400 pts/0    Ss   20:00   0:00 bash
user       820  0.1  0.3  42100 14200 pts/0    S+   21:15   0:00 node /app/server.js
user       945  0.0  0.0  10420  2100 pts/0    R+   21:15   0:00 ps aux`,
          };
        }
        return {
          output: `  PID TTY          TIME CMD
  501 pts/0    00:00:00 bash
  945 pts/0    00:00:00 ps`,
        };
      }

      case "kill": {
        if (args.length === 0) {
          return { output: "kill: falta el argumento de PID", isError: true };
        }
        const pid = args[args.length - 1];
        return { output: `[Proceso ${pid} terminado con señal SIGTERM]` };
      }

      case "ip":
      case "ifconfig": {
        return {
          output: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever`,
        };
      }

      case "ping": {
        const host = args.find((a) => !a.startsWith("-")) || "1.1.1.1";
        const count = 3;
        return {
          output: `PING ${host} (${host}) 56(84) bytes of data.
64 bytes from ${host}: icmp_seq=1 ttl=118 time=8.24 ms
64 bytes from ${host}: icmp_seq=2 ttl=118 time=8.11 ms
64 bytes from ${host}: icmp_seq=3 ttl=118 time=8.35 ms

--- ${host} ping statistics ---
${count} packets transmitted, ${count} received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 8.110/8.233/8.350/0.098 ms`,
        };
      }

      case "curl": {
        const url = args.find((a) => a.startsWith("http://") || a.startsWith("https://")) || args[0];
        if (!url) {
          return { output: "curl: try 'curl --help' for more information", isError: true };
        }
        if (args.includes("-I") || args.includes("--head")) {
          return {
            output: `HTTP/2 200
server: cloudflare
date: ${new Date().toUTCString()}
content-type: text/html; charset=UTF-8
vary: Accept-Encoding
cache-control: public, max-age=14400`,
          };
        }
        return {
          output: `{"status": 200, "message": "Respuesta mock exitosa desde ${url}", "timestamp": "${new Date().toISOString()}"}`,
        };
      }

      case "history":
        return {
          output: commandHistory
            .slice()
            .reverse()
            .map((h, i) => `  ${(i + 1).toString().padStart(4, " ")}  ${h}`)
            .join("\n"),
        };

      case "ls": {
        const flags = args.filter((a) => a.startsWith("-")).join("");
        const targetPath = args.find((a) => !a.startsWith("-")) || currentDir;
        const showAll = flags.includes("a");
        const showLong = flags.includes("l");

        const { node } = resolveNode(targetPath);
        if (!node) {
          return {
            output: `ls: no se puede acceder a '${targetPath}': No existe el archivo o el directorio`,
            isError: true,
          };
        }

        if (node.type === "file") {
          return { output: targetPath };
        }

        const entries = Object.entries(node.children || {});
        if (showLong) {
          const lines: string[] = [];
          if (showAll) {
            lines.push("drwxr-xr-x 2 user user 4096 Sep 30 20:45 .");
            lines.push("drwxr-xr-x 4 user user 4096 Sep 30 20:45 ..");
          }
          entries.forEach(([name, item]) => {
            const isDir = item.type === "dir";
            const perms = item.permissions || (isDir ? "drwxr-xr-x" : "-rw-r--r--");
            const size = isDir ? 4096 : (item.content || "").length;
            lines.push(
              `${perms} 1 user user ${size.toString().padStart(5, " ")} Sep 30 21:00 ${name}${isDir ? "/" : ""}`
            );
          });
          return { output: lines.join("\n") };
        }

        const formatted = entries
          .map(([name, item]) => (item.type === "dir" ? `${name}/` : name))
          .join("   ");
        return { output: formatted };
      }

      case "tree": {
        const targetPath = args[0] || currentDir;
        const { node, fullPath } = resolveNode(targetPath);
        if (!node || node.type !== "dir") {
          return {
            output: `tree: '${targetPath}': No es un directorio válido`,
            isError: true,
          };
        }
        const lines = renderTree(node);
        return {
          output: `${fullPath}\n${lines.join("\n")}\n\n${lines.length} entradas listadas`,
        };
      }

      case "cd": {
        const target = args[0] || "/home/user";
        if (target === "~" || target === "") {
          setCurrentDir("/home/user");
          return { output: "" };
        }
        if (target === "..") {
          const parts = currentDir.split("/").filter(Boolean);
          parts.pop();
          setCurrentDir(parts.length === 0 ? "/" : `/${parts.join("/")}`);
          return { output: "" };
        }
        const { node, fullPath } = resolveNode(target);
        if (!node) {
          return {
            output: `bash: cd: ${target}: No existe el archivo o el directorio`,
            isError: true,
          };
        }
        if (node.type !== "dir") {
          return { output: `bash: cd: ${target}: No es un directorio`, isError: true };
        }
        setCurrentDir(fullPath);
        return { output: "" };
      }

      case "cat": {
        const contentSources: string[] = [];
        if (pipedStdin) contentSources.push(pipedStdin);

        for (const arg of args) {
          const { node } = resolveNode(arg);
          if (!node) {
            return {
              output: `cat: ${arg}: No existe el archivo o el directorio`,
              isError: true,
            };
          }
          if (node.type === "dir") {
            return { output: `cat: ${arg}: Es un directorio`, isError: true };
          }
          contentSources.push(node.content || "");
        }

        if (contentSources.length === 0) {
          return { output: "" };
        }
        return { output: contentSources.join("\n") };
      }

      case "touch": {
        if (args.length === 0) {
          return { output: "touch: falta el operando", isError: true };
        }
        saveFileToFs(args[0], "");
        return { output: "" };
      }

      case "mkdir": {
        if (args.length === 0) {
          return { output: "mkdir: falta el operando", isError: true };
        }
        const dirName = args.filter((a) => !a.startsWith("-"))[0];
        const { fullPath } = resolveNode(dirName);
        const parts = fullPath.split("/").filter(Boolean);
        const newDir = parts.pop();
        if (!newDir) return { output: "" };

        setFs((prev) => {
          const copy = JSON.parse(JSON.stringify(prev));
          let curr = copy;
          for (const p of parts) {
            if (!curr[p]) curr[p] = { type: "dir", children: {} };
            if (!curr[p].children) curr[p].children = {};
            curr = curr[p].children;
          }
          if (curr[newDir]) return prev;
          curr[newDir] = {
            type: "dir",
            permissions: "rwxr-xr-x",
            children: {},
          };
          return copy;
        });
        return { output: "" };
      }

      case "rm": {
        if (args.length === 0) {
          return { output: "rm: falta el operando", isError: true };
        }
        const target = args.filter((a) => !a.startsWith("-"))[0];
        const { fullPath, node } = resolveNode(target);
        if (!node) {
          return {
            output: `rm: no se puede borrar '${target}': No existe el archivo o el directorio`,
            isError: true,
          };
        }
        const parts = fullPath.split("/").filter(Boolean);
        const toDelete = parts.pop();
        if (!toDelete) return { output: "" };

        setFs((prev) => {
          const copy = JSON.parse(JSON.stringify(prev));
          let curr = copy;
          for (const p of parts) {
            if (!curr[p] || !curr[p].children) return prev;
            curr = curr[p].children;
          }
          delete curr[toDelete];
          return copy;
        });
        return { output: "" };
      }

      case "cp": {
        if (args.length < 2) {
          return { output: "cp: faltan operandos (origen destino)", isError: true };
        }
        const src = args[0];
        const dest = args[1];
        const { node: srcNode } = resolveNode(src);
        if (!srcNode || srcNode.type !== "file") {
          return {
            output: `cp: no se puede leer '${src}': No es un archivo regular`,
            isError: true,
          };
        }
        saveFileToFs(dest, srcNode.content || "");
        return { output: "" };
      }

      case "mv": {
        if (args.length < 2) {
          return { output: "mv: faltan operandos (origen destino)", isError: true };
        }
        const src = args[0];
        const dest = args[1];
        const { node: srcNode } = resolveNode(src);
        if (!srcNode || srcNode.type !== "file") {
          return {
            output: `mv: no se puede mover '${src}': No existe el archivo`,
            isError: true,
          };
        }
        saveFileToFs(dest, srcNode.content || "");
        // remove original
        const { fullPath } = resolveNode(src);
        const parts = fullPath.split("/").filter(Boolean);
        const toDelete = parts.pop();
        if (toDelete) {
          setFs((prev) => {
            const copy = JSON.parse(JSON.stringify(prev));
            let curr = copy;
            for (const p of parts) {
              if (!curr[p] || !curr[p].children) return prev;
              curr = curr[p].children;
            }
            delete curr[toDelete];
            return copy;
          });
        }
        return { output: "" };
      }

      case "grep": {
        if (args.length === 0) {
          return { output: "grep: falta el patrón de búsqueda", isError: true };
        }
        const isIgnoreCase = args.some((a) => a.includes("i"));
        const isInvert = args.some((a) => a.includes("v"));
        const isNumbered = args.some((a) => a.includes("n"));
        const cleanArgs = args.filter((a) => !a.startsWith("-"));

        const pattern = cleanArgs[0];
        const filePath = cleanArgs[1];

        let textToSearch = pipedStdin || "";
        if (filePath) {
          const { node } = resolveNode(filePath);
          if (!node || node.type !== "file") {
            return {
              output: `grep: ${filePath}: No existe el archivo o no se puede leer`,
              isError: true,
            };
          }
          textToSearch = node.content || "";
        }

        const lines = textToSearch.split("\n");
        const regex = new RegExp(pattern, isIgnoreCase ? "i" : "");
        const matched = lines
          .map((line, idx) => ({ line, num: idx + 1 }))
          .filter(({ line }) => {
            const hit = regex.test(line);
            return isInvert ? !hit : hit;
          })
          .map(({ line, num }) => (isNumbered ? `${num}:${line}` : line));

        return { output: matched.join("\n") };
      }

      case "find": {
        const rootPath = args.find((a) => !a.startsWith("-")) || currentDir;
        const nameIdx = args.indexOf("-name");
        const namePattern = nameIdx !== -1 ? args[nameIdx + 1] : null;

        const results: string[] = [];
        const traverse = (node: FileSystemNode, pathStr: string) => {
          if (namePattern) {
            const regex = new RegExp(namePattern.replace(/\*/g, ".*"));
            if (regex.test(pathStr)) results.push(pathStr);
          } else {
            results.push(pathStr);
          }
          if (node.type === "dir" && node.children) {
            Object.entries(node.children).forEach(([name, child]) => {
              traverse(child, `${pathStr === "/" ? "" : pathStr}/${name}`);
            });
          }
        };

        const { node, fullPath } = resolveNode(rootPath);
        if (node) traverse(node, fullPath);
        return { output: results.join("\n") };
      }

      case "wc": {
        const flag = args.find((a) => a.startsWith("-")) || "-l";
        const file = args.find((a) => !a.startsWith("-"));
        let text = pipedStdin || "";
        if (file) {
          const { node } = resolveNode(file);
          if (node && node.type === "file") text = node.content || "";
        }
        const lines = text ? text.split("\n").length : 0;
        const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        const chars = text.length;

        if (flag === "-l") return { output: `${lines} ${file || ""}` };
        if (flag === "-w") return { output: `${words} ${file || ""}` };
        if (flag === "-c") return { output: `${chars} ${file || ""}` };
        return { output: `${lines} ${words} ${chars} ${file || ""}` };
      }

      case "head": {
        let n = 10;
        const nIdx = args.indexOf("-n");
        if (nIdx !== -1 && args[nIdx + 1]) n = parseInt(args[nIdx + 1], 10) || 10;
        const file = args.find((a, i) => !a.startsWith("-") && i !== nIdx + 1);

        let text = pipedStdin || "";
        if (file) {
          const { node } = resolveNode(file);
          if (node && node.type === "file") text = node.content || "";
        }
        return { output: text.split("\n").slice(0, n).join("\n") };
      }

      case "tail": {
        let n = 10;
        const nIdx = args.indexOf("-n");
        if (nIdx !== -1 && args[nIdx + 1]) n = parseInt(args[nIdx + 1], 10) || 10;
        const file = args.find((a, i) => !a.startsWith("-") && i !== nIdx + 1);

        let text = pipedStdin || "";
        if (file) {
          const { node } = resolveNode(file);
          if (node && node.type === "file") text = node.content || "";
        }
        const splitted = text.split("\n");
        return { output: splitted.slice(Math.max(0, splitted.length - n)).join("\n") };
      }

      case "sort": {
        const file = args.find((a) => !a.startsWith("-"));
        let text = pipedStdin || "";
        if (file) {
          const { node } = resolveNode(file);
          if (node && node.type === "file") text = node.content || "";
        }
        const isReverse = args.some((a) => a.includes("r"));
        const sorted = text.split("\n").sort();
        if (isReverse) sorted.reverse();
        return { output: sorted.join("\n") };
      }

      case "uniq": {
        const file = args.find((a) => !a.startsWith("-"));
        let text = pipedStdin || "";
        if (file) {
          const { node } = resolveNode(file);
          if (node && node.type === "file") text = node.content || "";
        }
        const lines = text.split("\n");
        const unique = lines.filter((l, i) => i === 0 || l !== lines[i - 1]);
        return { output: unique.join("\n") };
      }

      case "base64": {
        const isDecode = args.includes("-d") || args.includes("--decode");
        const content = pipedStdin || args.filter((a) => !a.startsWith("-")).join(" ");
        try {
          if (isDecode) {
            return { output: atob(content.trim()) };
          }
          return { output: btoa(content) };
        } catch {
          return { output: "base64: entrada inválida", isError: true };
        }
      }

      case "chmod": {
        if (args.length < 2) {
          return { output: "chmod: faltan operandos (permiso archivo)", isError: true };
        }
        const perms = args[0];
        const target = args[1];
        const { node } = resolveNode(target);
        if (!node) {
          return {
            output: `chmod: no se puede acceder a '${target}': No existe el archivo`,
            isError: true,
          };
        }
        node.permissions = perms.startsWith("+")
          ? "rwxr-xr-x"
          : perms === "755"
          ? "rwxr-xr-x"
          : "rw-r--r--";
        return { output: "" };
      }

      case "stat": {
        if (args.length === 0) {
          return { output: "stat: falta el operando", isError: true };
        }
        const target = args[0];
        const { node, fullPath } = resolveNode(target);
        if (!node) {
          return {
            output: `stat: no se puede hacer stat a '${target}': No existe el archivo o el directorio`,
            isError: true,
          };
        }
        const isDir = node.type === "dir";
        return {
          output: `  File: ${fullPath}
  Size: ${isDir ? 4096 : (node.content || "").length}  Blocks: 8  IO Block: 4096  ${isDir ? "directory" : "regular file"}
Device: 801h/2049d  Inode: 1048576  Links: 1
Access: (0755/${node.permissions || (isDir ? "rwxr-xr-x" : "rw-r--r--")})  Uid: ( 1000/    user)   Gid: ( 1000/    user)
Access: 2026-09-30 21:00:00.000000000 +0000
Modify: 2026-09-30 21:00:00.000000000 +0000
Change: 2026-09-30 21:00:00.000000000 +0000`,
        };
      }

      case "echo": {
        const text = args.join(" ").replace(/^["']|["']$/g, "");
        return { output: text };
      }

      // Execute complex shell code in Wandbox real Ubuntu Linux container
      default: {
        setIsExecuting(true);
        try {
          const res = await fetch("/api/compile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language: "bash",
              compiler: "bash",
              code: cmdLine,
            }),
          });
          const data = await res.json();
          if (data.stderr) {
            return { output: data.stderr, isError: true };
          }
          return {
            output:
              data.stdout || data.compilerOutput || "(Comando finalizado sin salida)",
          };
        } catch {
          return {
            output: `bash: comando no encontrado: ${cmd}. Escribe 'help' para ver la lista de comandos disponibles.`,
            isError: true,
          };
        } finally {
          setIsExecuting(false);
        }
      }
    }
  };

  // Keyboard navigation & tab auto-completion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommand(commandInput);
      setCommandInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIndex);
        setCommandInput(commandHistory[nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCommandInput(commandHistory[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = commandInput.split(" ");
      const currentWord = parts[parts.length - 1];
      const builtins = [
        "ls", "cd", "pwd", "cat", "nano", "vim", "mkdir", "touch", "rm", "cp", "mv",
        "chmod", "tree", "stat", "grep", "find", "wc", "head", "tail", "sort", "uniq",
        "diff", "base64", "echo", "clear", "help", "uname", "whoami", "hostname",
        "date", "uptime", "free", "df", "du", "neofetch", "lscpu", "lsblk", "dmesg",
        "ps", "top", "kill", "ip", "ifconfig", "ping", "curl", "cal", "bc", "export",
        "env", "history", "session"
      ];

      // Match builtins
      let match = builtins.find((b) => b.startsWith(currentWord));

      // Or match files in current directory
      if (!match) {
        const { node } = resolveNode(currentDir);
        if (node && node.children) {
          const files = Object.keys(node.children);
          match = files.find((f) => f.startsWith(currentWord));
        }
      }

      if (match) {
        parts[parts.length - 1] = match;
        setCommandInput(parts.join(" "));
      }
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setHistory([]);
    } else if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      setHistory((prev) => [
        ...prev,
        { command: `${commandInput}^C`, output: "", directory: currentDir },
      ]);
      setCommandInput("");
    }
  };

  const formatPath = (path: string) => {
    if (path === "/home/user") return "~";
    if (path.startsWith("/home/user/")) return path.replace("/home/user", "~");
    return path;
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div
      className={`flex flex-col bg-[#050608] text-zinc-100 font-mono select-text transition-all ${
        isFullscreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-screen w-full"
      }`}
      onClick={focusInput}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neon-green text-black font-semibold px-4 py-2 rounded shadow-2xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Linux Window Top Bar */}
      <div className="h-10 bg-[#10141d] border-b border-zinc-800 px-3 flex items-center justify-between select-none">
        {/* Window controls */}
        <div className="flex items-center gap-2">
          <Link
            href="/playground"
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:opacity-80 transition-opacity"
            title="Volver a los Playgrounds"
            aria-label="Cerrar y volver a selector"
          />
          <button
            onClick={() => setHistory([])}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:opacity-80 transition-opacity"
            title="Limpiar terminal (clear)"
            aria-label="Limpiar pantalla"
          />
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:opacity-80 transition-opacity"
            title="Pantalla completa"
            aria-label="Alternar pantalla completa"
          />

          <span className="ml-2 text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-neon-green" />
            <span className="hidden sm:inline">broslunas@ejecuta.tech-sandbox:</span>
            <span className="text-neon-cyan">{formatPath(currentDir)}</span>
          </span>
        </div>

        {/* Project Sessions Selector & Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Active Session Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSessionsOpen(!isSessionsOpen);
              }}
              className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700/80 text-neon-green hover:border-neon-green text-xs flex items-center gap-1.5 transition-colors"
              title="Administrar Proyectos y Sesiones de Terminal"
              aria-label="Administrar sesiones"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate font-medium">
                {activeSession?.name || "Sesión"}
              </span>
              <span className="text-[10px] text-zinc-500">
                ({sessions.length})
              </span>
            </button>

            {/* Sessions Dropdown Modal / Popover */}
            {isSessionsOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1.5 w-72 rounded-lg bg-zinc-900 border border-zinc-700 shadow-2xl p-3 z-50 text-xs font-mono text-zinc-300 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-semibold text-white uppercase text-[10px] tracking-wider">
                    Sesiones de Linux ({sessions.length})
                  </span>
                  <button
                    onClick={() => setIsSessionsOpen(false)}
                    className="text-zinc-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Session List */}
                <div className="my-2 max-h-48 overflow-y-auto space-y-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => switchSession(s.id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        s.id === activeSessionId
                          ? "bg-zinc-800 text-neon-green border border-neon-green/30"
                          : "hover:bg-zinc-800/60 text-zinc-300"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold truncate">{s.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(s.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {s.id === activeSessionId && (
                          <Check className="w-3.5 h-3.5 text-neon-green" />
                        )}
                        {sessions.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteSession(s.id, e)}
                            className="p-1 text-zinc-500 hover:text-red-400 rounded"
                            title="Eliminar sesión"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create New Session Input */}
                <div className="pt-2 border-t border-zinc-800 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Nueva sesión..."
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateSession();
                    }}
                    className="flex-1 bg-black/60 border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-neon-green"
                  />
                  <button
                    onClick={() => handleCreateSession()}
                    className="px-2 py-1 bg-neon-green text-black rounded font-semibold hover:bg-[#00e67a] text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear</span>
                  </button>
                </div>

                {/* Export Session Action */}
                <button
                  onClick={handleExportSession}
                  className="w-full mt-2 py-1.5 px-2 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar sesión (JSON)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Clear */}
          <button
            onClick={() => setHistory([])}
            className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
            title="Limpiar pantalla (Ctrl+L)"
            aria-label="Limpiar pantalla"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset FS */}
          <button
            onClick={() => {
              setFs(DEFAULT_FS);
              setCurrentDir("/home/user");
              setHistory([]);
              showToast("Sistema de archivos reiniciado");
            }}
            className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            title="Restablecer archivos iniciales"
            aria-label="Reiniciar sistema de archivos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            aria-label="Pantalla completa"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Interactive Nano Text Editor Modal */}
      {isNanoOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex flex-col bg-[#020305] text-zinc-100 font-mono select-text"
        >
          {/* Nano Top Header */}
          <div className="bg-[#1f2937] text-white px-3 py-1 text-xs flex justify-between items-center select-none border-b border-zinc-700">
            <span>GNU nano 7.2</span>
            <span className="font-semibold text-neon-green">
              Archivo: {nanoFilePath}
            </span>
            <span className="text-zinc-400">{nanoStatus}</span>
          </div>

          {/* Nano Textarea Area */}
          <textarea
            ref={nanoTextareaRef}
            value={nanoContent}
            onChange={(e) => setNanoContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "o") {
                e.preventDefault();
                saveFileToFs(nanoFilePath, nanoContent);
                setNanoStatus("[ Guardado en disco ✓ ]");
                showToast(`Guardado: ${nanoFilePath}`);
              } else if (e.ctrlKey && e.key === "x") {
                e.preventDefault();
                setIsNanoOpen(false);
                setHistory((prev) => [
                  ...prev,
                  {
                    command: `nano ${nanoFilePath}`,
                    output: `[Archivo '${nanoFilePath}' cerrado]`,
                    directory: currentDir,
                  },
                ]);
              }
            }}
            spellCheck={false}
            className="flex-1 w-full p-4 bg-[#050608] text-zinc-200 outline-none resize-none font-mono text-xs sm:text-sm leading-relaxed border-none"
          />

          {/* Nano Bottom Shortcut Bar */}
          <div className="bg-[#111827] text-zinc-300 p-2 text-xs border-t border-zinc-800 flex flex-wrap gap-4 items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  saveFileToFs(nanoFilePath, nanoContent);
                  setNanoStatus("[ Guardado ✓ ]");
                  showToast(`Guardado: ${nanoFilePath}`);
                }}
                className="px-3 py-1 bg-neon-green text-black rounded font-semibold flex items-center gap-1 hover:bg-[#00e67a]"
              >
                <Save className="w-3 h-3" />
                <span>^O Guardar</span>
              </button>
              <button
                onClick={() => {
                  setIsNanoOpen(false);
                  setHistory((prev) => [
                    ...prev,
                    {
                      command: `nano ${nanoFilePath}`,
                      output: `[Archivo '${nanoFilePath}' cerrado]`,
                      directory: currentDir,
                    },
                  ]);
                }}
                className="px-3 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>^X Salir</span>
              </button>
            </div>
            <div className="text-[11px] text-zinc-400 hidden sm:flex gap-4">
              <span>^O: Guardar archivo</span>
              <span>^X: Salir del editor</span>
              <span>Líneas: {nanoContent.split("\n").length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Top / Htop Process Monitor */}
      {isTopOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex flex-col bg-[#050608] text-zinc-100 p-4 font-mono text-xs overflow-y-auto"
        >
          {/* Header */}
          <div className="space-y-1 pb-3 border-b border-zinc-800 text-zinc-300">
            <div className="flex justify-between items-center">
              <p className="text-neon-green font-bold">
                top - {new Date().toLocaleTimeString()} up {Math.floor(topUptimeSeconds / 60)} min,  1 user,  load average: 0.08, 0.03, 0.01
              </p>
              <button
                onClick={() => setIsTopOpen(false)}
                className="px-2 py-0.5 bg-red-900/40 text-red-300 border border-red-700/50 rounded hover:bg-red-800"
              >
                Presiona &apos;q&apos; o clic aquí para salir
              </button>
            </div>
            <p className="text-zinc-400">
              Tasks: 96 total,   1 running,  95 sleeping,   0 stopped,   0 zombie
            </p>
            <p className="text-zinc-400">
              %Cpu(s):  2.4 us,  1.1 sy,  0.0 ni, 96.2 id,  0.2 wa,  0.0 hi,  0.1 si
            </p>
            <p className="text-zinc-400">
              MiB Mem :   4096.0 total,   1640.2 free,   1220.8 used,   1235.0 buff/cache
            </p>
          </div>

          {/* Process Table */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-800 text-white">
                  <th className="p-1">PID</th>
                  <th className="p-1">USER</th>
                  <th className="p-1">PR</th>
                  <th className="p-1">NI</th>
                  <th className="p-1">VIRT</th>
                  <th className="p-1">RES</th>
                  <th className="p-1">%CPU</th>
                  <th className="p-1">%MEM</th>
                  <th className="p-1">TIME+</th>
                  <th className="p-1">COMMAND</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                <tr className="text-neon-green">
                  <td className="p-1">1024</td>
                  <td className="p-1">user</td>
                  <td className="p-1">20</td>
                  <td className="p-1">0</td>
                  <td className="p-1">24.5M</td>
                  <td className="p-1">6.2M</td>
                  <td className="p-1">1.8</td>
                  <td className="p-1">0.2</td>
                  <td className="p-1">0:01.42</td>
                  <td className="p-1">top</td>
                </tr>
                <tr>
                  <td className="p-1">501</td>
                  <td className="p-1">user</td>
                  <td className="p-1">20</td>
                  <td className="p-1">0</td>
                  <td className="p-1">18.4M</td>
                  <td className="p-1">5.4M</td>
                  <td className="p-1">0.1</td>
                  <td className="p-1">0.1</td>
                  <td className="p-1">0:00.32</td>
                  <td className="p-1">bash</td>
                </tr>
                <tr>
                  <td className="p-1">820</td>
                  <td className="p-1">user</td>
                  <td className="p-1">20</td>
                  <td className="p-1">0</td>
                  <td className="p-1">84.2M</td>
                  <td className="p-1">32.1M</td>
                  <td className="p-1">0.2</td>
                  <td className="p-1">0.8</td>
                  <td className="p-1">0:02.10</td>
                  <td className="p-1">node server.js</td>
                </tr>
                <tr>
                  <td className="p-1">1</td>
                  <td className="p-1">root</td>
                  <td className="p-1">20</td>
                  <td className="p-1">0</td>
                  <td className="p-1">168M</td>
                  <td className="p-1">12.8M</td>
                  <td className="p-1">0.0</td>
                  <td className="p-1">0.3</td>
                  <td className="p-1">0:03.45</td>
                  <td className="p-1">/sbin/init</td>
                </tr>
                <tr>
                  <td className="p-1">240</td>
                  <td className="p-1">root</td>
                  <td className="p-1">20</td>
                  <td className="p-1">0</td>
                  <td className="p-1">25.8M</td>
                  <td className="p-1">5.2M</td>
                  <td className="p-1">0.0</td>
                  <td className="p-1">0.1</td>
                  <td className="p-1">0:00.18</td>
                  <td className="p-1">systemd-journald</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Terminal Screen Body */}
      {!isNanoOpen && !isTopOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs sm:text-sm bg-[#07090e] text-zinc-200">
          {/* Welcome MOTD */}
          <div className="text-zinc-400 select-none pb-2 border-b border-zinc-900 leading-relaxed">
            <p className="text-neon-green font-bold">
              Welcome to ejecuta.tech based on Linux
            </p>
            <p className="text-zinc-400 mt-1">
              * Sesión actual: <span className="text-white font-semibold">{activeSession?.name}</span> (Persistencia local activa)
            </p>
            <p className="text-zinc-500">
              * Comandos: <span className="text-neon-cyan">help</span>, editor <span className="text-neon-cyan">nano &lt;archivo&gt;</span>, monitor <span className="text-neon-cyan">top</span>, árbol <span className="text-neon-cyan">tree</span>, o tuberías <span className="text-neon-cyan">cat | grep</span>.
            </p>
          </div>

          {/* Command History Stream */}
          {history.map((entry, index) => (
            <div key={index} className="space-y-1">
              {/* Prompt line */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-neon-green font-semibold">broslunas@ejecuta.tech</span>
                <span className="text-zinc-500">:</span>
                <span className="text-blue-400 font-semibold">
                  {formatPath(entry.directory)}
                </span>
                <span className="text-zinc-300">$</span>
                <span className="text-white font-medium">{entry.command}</span>
              </div>

              {/* Output block */}
              {entry.output && (
                <pre
                  className={`whitespace-pre-wrap pl-2 leading-relaxed ${
                    entry.isError ? "text-red-400" : "text-zinc-300"
                  }`}
                >
                  {entry.output}
                </pre>
              )}
            </div>
          ))}

          {/* Active Input Line */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-neon-green font-semibold">broslunas@ejecuta.tech</span>
            <span className="text-zinc-500">:</span>
            <span className="text-blue-400 font-semibold">
              {formatPath(currentDir)}
            </span>
            <span className="text-zinc-300">$</span>

            <div className="relative flex-1 min-w-[200px] flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isExecuting}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                className="w-full bg-transparent text-white outline-none border-none p-0 font-mono text-xs sm:text-sm focus:ring-0"
                aria-label="Línea de comando Bash"
              />
              {isExecuting && (
                <span className="text-xs text-amber-400 italic ml-2 animate-pulse">
                  [Ejecutando...]
                </span>
              )}
            </div>
          </div>

          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
}
