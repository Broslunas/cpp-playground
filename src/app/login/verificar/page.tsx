"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, KeyRound, AlertCircle, ArrowLeft, Mail } from "lucide-react";

function Verify2FAForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/playground";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), returnTo }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo en la verificación de seguridad");
      }

      router.push(data.redirect || "/playground");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al verificar código";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#0b0e15] p-6 sm:p-8 shadow-2xl relative">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Verificación en Dos Pasos (2FA)
        </h1>
        <p className="text-xs text-zinc-400 mt-1 font-sans">
          {isRecoveryMode
            ? "Introduce uno de tus códigos de recuperación de 8 caracteres (ej. A7K2-9M4P)."
            : "Introduce el código de 6 dígitos generado por tu app de autenticación (Google Authenticator, Authy, etc.)."}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="auth-code" className="block text-xs text-zinc-400 mb-1.5 font-semibold">
            {isRecoveryMode ? "Código de recuperación" : "Código de 6 dígitos"}
          </label>
          <input
            id="auth-code"
            type="text"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={isRecoveryMode ? "XXXX-XXXX" : "123456"}
            maxLength={isRecoveryMode ? 12 : 6}
            className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-4 rounded-xl bg-black border border-zinc-700 focus:border-neon-green focus:outline-none text-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full py-2.5 px-4 rounded-xl bg-neon-green hover:bg-[#00e67a] active:bg-[#00cc6c] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,136,0.2)] disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" />
          <span>{loading ? "Verificando..." : "Confirmar y Entrar"}</span>
        </button>
      </form>

      {/* Alternar entre TOTP y Código de Recuperación */}
      <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col items-center gap-2 text-xs font-sans">
        <button
          type="button"
          onClick={() => {
            setIsRecoveryMode(!isRecoveryMode);
            setCode("");
            setErrorMsg("");
          }}
          className="text-neon-cyan hover:underline"
        >
          {isRecoveryMode
            ? "← Usar código de app autenticadora"
            : "¿Perdiste tu app? Usar código de recuperación"}
        </button>

        <a
          href="mailto:info@broslunas.com?subject=Recuperacion%20de%20cuenta%20Playground"
          className="text-zinc-500 hover:text-zinc-300 text-[11px] flex items-center gap-1 mt-1"
        >
          <Mail className="w-3 h-3" />
          <span>¿No tienes acceso? Contacta a info@broslunas.com</span>
        </a>
      </div>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <div className="min-h-screen bg-[#08090f] text-zinc-100 flex flex-col justify-between font-mono selection:bg-neon-green/30 selection:text-white">
      <header className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-neon-green" />
          <span>Volver al Login</span>
        </Link>
        <span className="text-xs text-zinc-500 font-bold">
          Broslunas <span className="text-neon-green">Playground</span>
        </span>
      </header>

      <main className="max-w-md w-full mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <Suspense
          fallback={
            <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">
              Cargando verificación de seguridad...
            </div>
          }
        >
          <Verify2FAForm />
        </Suspense>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-zinc-600 border-t border-zinc-800/40">
        Broslunas Playground • Seguridad Cero Contraseñas
      </footer>
    </div>
  );
}
