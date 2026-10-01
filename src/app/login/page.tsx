"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { KeyRound, ArrowLeft, Terminal, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/playground";
  const authError = searchParams.get("error");

  const [loadingPasskey, setLoadingPasskey] = useState(false);
  const [errorMsg, setErrorMsg] = useState(authError || "");

  const handlePasskeyLogin = async () => {
    setErrorMsg("");
    setLoadingPasskey(true);
    try {
      // 1. Obtener opciones del servidor
      const optRes = await fetch("/api/auth/passkeys/authenticate");
      if (!optRes.ok) {
        const data = await optRes.json();
        throw new Error(data.error || "No se pudo iniciar la autenticación con Passkey");
      }
      const options = await optRes.json();

      // 2. Iniciar autenticación WebAuthn en el navegador
      const asseResp = await startAuthentication({ optionsJSON: options });

      // 3. Enviar verificación al servidor
      const verifyRes = await fetch("/api/auth/passkeys/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authenticationResponse: asseResp }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Fallo al verificar passkey");
      }

      if (verifyData.requires2FA) {
        router.push(`/login/verificar?returnTo=${encodeURIComponent(returnTo)}`);
      } else {
        router.push(returnTo);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al autenticar con passkey";
      setErrorMsg(msg);
    } finally {
      setLoadingPasskey(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#0b0e15] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title & subtitle */}
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center mx-auto mb-3 text-neon-green">
          <Terminal className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Iniciar Sesión
        </h1>
        <p className="text-xs text-zinc-400 mt-1 font-sans">
          Accede sin contraseñas con tu Passkey biométrica o tu cuenta de GitHub.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Opción 1: Passkey / WebAuthn */}
        <button
          onClick={handlePasskeyLogin}
          disabled={loadingPasskey}
          className="w-full py-3 px-4 rounded-xl bg-neon-green hover:bg-[#00e67a] active:bg-[#00cc6c] text-black font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(0,255,136,0.25)] disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4 fill-current" />
          <span>{loadingPasskey ? "Esperando autenticación..." : "Usar Passkey (Huella / Face / PIN)"}</span>
        </button>

        {/* Divisor */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-zinc-800" />
          <span className="absolute bg-[#0b0e15] px-2 text-[10px] text-zinc-500 uppercase tracking-widest">
            o también
          </span>
        </div>

        {/* Opción 2: GitHub OAuth */}
        <a
          href={`/api/auth/github/login?returnTo=${encodeURIComponent(returnTo)}`}
          className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>Continuar con GitHub</span>
        </a>
      </div>

      {/* Seguridad y Privacidad */}
      <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 space-y-1 text-center font-sans">
        <p>
          🔒 <strong>Cero contraseñas:</strong> No almacenamos contraseñas de usuarios.
        </p>
        <p>
          ¿Tienes 2FA activo? Se te solicitará el código de 6 dígitos o de recuperación en el siguiente paso.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#08090f] text-zinc-100 flex flex-col justify-between selection:bg-neon-green/30 selection:text-white font-mono">
      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
        <Link
          href="/playground"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-neon-green" />
          <span>Volver al Playground</span>
        </Link>
        <span className="text-xs text-zinc-500 font-bold">
          Broslunas <span className="text-neon-green">Playground</span>
        </span>
      </header>

      {/* Main card */}
      <main className="max-w-md w-full mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <Suspense
          fallback={
            <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">
              Cargando pantalla de acceso...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-zinc-600 border-t border-zinc-800/40">
        Broslunas Playground • Soporte: info@broslunas.com
      </footer>
    </div>
  );
}
