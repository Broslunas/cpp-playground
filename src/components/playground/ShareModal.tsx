"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  X,
  Link as LinkIcon,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Shield,
  RotateCcw,
} from "lucide-react";
import {
  ShareableState,
  createShortShare,
  generateShareUrl,
  CreateShareResult,
} from "@/lib/share";
import { SupportedLanguage } from "@/types";
import { getLanguage } from "@/lib/languages";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  language: SupportedLanguage;
  code: string;
  stdin?: string;
  compiler?: string;
  standard?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings?: any;
}

export function ShareModal({
  isOpen,
  onClose,
  projectName,
  language,
  code,
  stdin,
  compiler,
  standard,
  settings,
}: ShareModalProps) {
  // Modal form states
  const [customSlug, setCustomSlug] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [expiresIn, setExpiresIn] = useState<"never" | "1h" | "24h" | "7d" | "30d">("never");

  // Status & results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareResult, setShareResult] = useState<CreateShareResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset states when reopening with another project
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const langDef = getLanguage(language);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://ejecuta.tech";

  const currentState: ShareableState = {
    title: projectName,
    language,
    code,
    stdin,
    compiler,
    standard,
    settings,
  };

  const handleGenerateShare = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Validation
    if (usePassword && (!password || password.trim().length < 3)) {
      setError("La contraseña debe tener al menos 3 caracteres.");
      return;
    }

    if (customSlug.trim()) {
      const clean = customSlug.trim().toLowerCase();
      if (clean.length < 3) {
        setError("La URL personalizada debe tener al menos 3 caracteres.");
        return;
      }
      if (!/^[a-z0-9_-]+$/.test(clean)) {
        setError("La URL personalizada solo permite letras minúsculas, números, guiones y guiones bajos.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await createShortShare({
        state: currentState,
        customSlug: customSlug.trim() || undefined,
        password: usePassword ? password.trim() : undefined,
        expiresIn,
      });

      if (!result.success) {
        setError(result.error || "No se pudo generar el enlace.");
      } else {
        setShareResult(result);
        if (result.fullUrl) {
          try {
            await navigator.clipboard.writeText(result.fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
          } catch {
            // Ignore clipboard errors
          }
        }
      }
    } catch {
      setError("Error inesperado al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareResult?.fullUrl) return;
    try {
      await navigator.clipboard.writeText(shareResult.fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyLegacyUrl = async () => {
    const legacyUrl = generateShareUrl(currentState);
    try {
      await navigator.clipboard.writeText(legacyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleResetForm = () => {
    setShareResult(null);
    setCustomSlug("");
    setUsePassword(false);
    setPassword("");
    setError(null);
    setCopied(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-mono text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Share2 className="w-4 h-4 text-neon-green shrink-0" />
            <div className="truncate">
              <h2 id="share-modal-title" className="text-sm font-bold text-zinc-100 truncate">
                Compartir Proyecto
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-neon-green border border-zinc-700 font-semibold shrink-0">
              {langDef.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Cerrar modal de compartir"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {shareResult && shareResult.fullUrl ? (
            /* Result Screen */
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-4 rounded-xl bg-neon-green/10 border border-neon-green/30 text-center space-y-2">
                <div className="inline-flex p-2 rounded-full bg-neon-green/20 text-neon-green mb-1">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">
                  ¡Enlace acortado listo!
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {copied
                    ? "¡Copiado automáticamente al portapapeles!"
                    : "Tu enlace corto ha sido generado con éxito."}
                </p>
              </div>

              {/* Generated URL Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                  Enlace de acceso rápido
                </label>
                <div className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <LinkIcon className="w-4 h-4 text-neon-green shrink-0 ml-1" />
                  <input
                    type="text"
                    readOnly
                    value={shareResult.fullUrl}
                    className="bg-transparent text-white font-mono text-xs w-full focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                      copied
                        ? "bg-neon-green text-black"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Badges Info */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                  <span className="text-zinc-400">Ruta:</span>
                  <span className="font-semibold text-neon-green">{shareResult.url}</span>
                </div>
                {shareResult.hasPassword && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>Protegido con contraseña</span>
                  </div>
                )}
                {expiresIn !== "never" && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Expira: {expiresIn}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={shareResult.fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-2 transition-colors font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir enlace en pestaña nueva
                </a>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Crear otro
                </button>
              </div>
            </div>
          ) : (
            /* Configure Share Form */
            <form onSubmit={handleGenerateShare} className="space-y-4">
              {/* Project preview header */}
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Proyecto a compartir
                  </div>
                  <div className="font-semibold text-zinc-200 truncate max-w-[280px]">
                    {projectName}
                  </div>
                </div>
                <div className="text-right text-[11px] text-zinc-400">
                  {code.split("\n").length} líneas
                </div>
              </div>

              {/* 1. Custom URL Slug */}
              <div className="space-y-1.5">
                <label
                  htmlFor="custom-slug-input"
                  className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between"
                >
                  <span>URL Personalizada (Opcional)</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Vacío = código aleatorio
                  </span>
                </label>
                <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950 focus-within:border-neon-green transition-colors overflow-hidden">
                  <span className="px-3 py-2 text-zinc-500 select-none bg-zinc-900 border-r border-zinc-800 text-xs truncate max-w-[150px] sm:max-w-[180px]">
                    {origin.replace(/^https?:\/\//, "")}/s/
                  </span>
                  <input
                    id="custom-slug-input"
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    placeholder="mi-proyecto-123"
                    maxLength={50}
                    className="w-full bg-transparent px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none text-xs font-mono"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                  Usa letras minúsculas, números, guiones o guiones bajos (ej: /s/mi-algoritmo)
                </p>
              </div>

              {/* 2. Password Protection */}
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-md ${
                        usePassword ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        Proteger con contraseña
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Solo quienes tengan la clave podrán ver el código
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUsePassword(!usePassword);
                      if (usePassword) setPassword("");
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      usePassword ? "bg-neon-green" : "bg-zinc-800"
                    }`}
                    role="switch"
                    aria-checked={usePassword}
                    aria-label="Activar protección con contraseña"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                        usePassword ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {usePassword && (
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 animate-in fade-in duration-150">
                    <label
                      htmlFor="share-password-input"
                      className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block"
                    >
                      Contraseña del enlace
                    </label>
                    <div className="relative">
                      <input
                        id="share-password-input"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Introduce una contraseña segura..."
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 pr-9 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-neon-green"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Link Expiration */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Caducidad del enlace</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: "never", label: "Nunca" },
                    { id: "1h", label: "1 hora" },
                    { id: "24h", label: "24 horas" },
                    { id: "7d", label: "7 días" },
                    { id: "30d", label: "30 días" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExpiresIn(opt.id as typeof expiresIn)}
                      className={`py-1.5 px-2 rounded-lg border text-center text-[11px] font-medium transition-colors ${
                        expiresIn === opt.id
                          ? "bg-neon-green/10 border-neon-green text-neon-green"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-neon-green hover:bg-neon-green/90 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-neon-green/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Generando enlace acortado...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generar Enlace Corto (/s/...)
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Legacy offline base64 fallback */}
          <div className="pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setShowLegacy(!showLegacy)}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 w-full justify-between"
            >
              <span>Opciones avanzadas / Modo offline</span>
              <span>{showLegacy ? "▲" : "▼"}</span>
            </button>
            {showLegacy && (
              <div className="mt-2 p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-lg space-y-2 text-[11px] text-zinc-400">
                <p>
                  Si no deseas almacenar datos en el servidor, puedes copiar el enlace directo
                  codificado en base64 (hash largo):
                </p>
                <button
                  type="button"
                  onClick={handleCopyLegacyUrl}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copiar enlace largo base64
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
