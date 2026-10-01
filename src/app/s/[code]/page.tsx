"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Terminal,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Code2,
} from "lucide-react";
import { PlaygroundWorkspace } from "@/components/playground/PlaygroundWorkspace";
import { LinuxTerminalWorkspace } from "@/components/playground/LinuxTerminalWorkspace";
import { fetchSharedSnippet, unlockSharedSnippet, SharedSnippetResponse } from "@/lib/share";
import { SupportedLanguage } from "@/types";
import { getLanguage } from "@/lib/languages";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function ShortSharePage({ params }: PageProps) {
  const { code } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [snippetData, setSnippetData] = useState<SharedSnippetResponse | null>(null);

  // Password Unlock Form
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSnippet() {
      setLoading(true);
      setError(null);
      setIsExpired(false);

      try {
        const res = await fetchSharedSnippet(code);
        if (!mounted) return;

        if (res.error) {
          setError(res.error);
          setIsExpired(Boolean(res.expired));
          setLoading(false);
          return;
        }

        setSnippetData(res);
      } catch {
        if (mounted) {
          setError("Error al cargar el proyecto compartido.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (code) {
      loadSnippet();
    }

    return () => {
      mounted = false;
    };
  }, [code]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setUnlockError("Introduce la contraseña.");
      return;
    }

    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const res = await unlockSharedSnippet(code, password.trim());
      if (!res.success || !res.data) {
        setUnlockError(res.error || "Contraseña incorrecta.");
      } else {
        setSnippetData(res.data);
      }
    } catch {
      setUnlockError("Error al verificar la contraseña.");
    } finally {
      setIsUnlocking(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4 font-mono text-xs select-none">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div className="text-zinc-200 font-bold text-sm">
            Cargando código compartido...
          </div>
          <div className="text-zinc-500 text-[11px] font-mono">
            /s/{code}
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State (Not Found or Expired)
  if (error || !snippetData) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4 font-mono text-xs">
        <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-bold text-zinc-100">
              {isExpired ? "Enlace Expirado" : "Enlace No Encontrado"}
            </h1>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {error || "El código compartido solicitado no existe o fue eliminado."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Password Required State
  if (snippetData.requiresPassword) {
    const lang = snippetData.language as SupportedLanguage;
    const langDef = getLanguage(lang);

    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4 font-mono text-xs">
        <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
          {/* Card Header */}
          <div className="px-6 py-5 bg-zinc-950/80 border-b border-zinc-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-100">
                Código Protegido con Contraseña
              </h1>
              <p className="text-zinc-400 text-xs mt-1">
                Este proyecto requiere una contraseña para ver el código y ejecutarlo.
              </p>
            </div>

            {/* Snippet summary badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
              <span className="font-semibold text-neon-green">{langDef.name}</span>
              <span className="text-zinc-600">•</span>
              <span className="truncate max-w-[180px]">{snippetData.title || "Sin título"}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="p-6 space-y-4">
            {unlockError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs">{unlockError}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="unlock-password"
                className="text-[11px] font-semibold text-zinc-300 block"
              >
                Contraseña de acceso
              </label>
              <div className="relative">
                <input
                  id="unlock-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce la contraseña..."
                  autoFocus
                  required
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-neon-green"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full py-2.5 px-4 rounded-xl bg-neon-green hover:bg-neon-green/90 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-neon-green/20 disabled:opacity-50 cursor-pointer"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando clave...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Desbloquear y Ver Código
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3 h-3" />
                Ir al playground general
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 4. Code Unlocked / Ready State
  const sharedLang = (snippetData.language || "cpp") as SupportedLanguage;

  if (sharedLang === "bash") {
    return <LinuxTerminalWorkspace />;
  }

  return (
    <PlaygroundWorkspace
      initialLanguage={sharedLang}
      initialSharedState={{
        title: snippetData.title,
        language: sharedLang,
        code: snippetData.code_content || "",
        stdin: snippetData.stdin,
        compiler: snippetData.compiler,
        standard: snippetData.standard,
        settings: snippetData.settings,
      }}
    />
  );
}
