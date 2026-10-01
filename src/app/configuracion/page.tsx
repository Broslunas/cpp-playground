"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AccountLayoutShell } from "@/components/account/AccountLayoutShell";
import { AuthUser } from "@/types";
import { fetchAuthStatus } from "@/lib/cloud-projects";
import { startRegistration } from "@simplewebauthn/browser";
import { QrCode } from "@/components/ui/QrCode";
import {
  Settings,
  Shield,
  Palette,
  Eye,
  Bell,
  HardDrive,
  KeyRound,
  Trash2,
  Download,
  AlertTriangle,
  Check,
  Plus,
  LogOut,
  Mail,
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Secciones
  const [activeSection, setActiveSection] = useState<"cuenta" | "apariencia" | "privacidad" | "seguridad" | "datos" | "notificaciones">("cuenta");

  // Apariencia
  const [editorTheme, setEditorTheme] = useState("one-dark");
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState<2 | 4>(2);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  // Notificaciones
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);

  // Seguridad
  const [passkeys, setPasskeys] = useState<{ id: string; name: string; createdAt: number }[]>([]);
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  // 2FA
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [setup2FAData, setSetup2FAData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [verifyToken, setVerifyToken] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState("");

  // Eliminación de cuenta
  const [deleteConfirmUser, setDeleteConfirmUser] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    fetchAuthStatus().then(async (res) => {
      if (res.user) {
        setUser(res.user);
        if (res.user.preferences) {
          setEditorTheme(res.user.preferences.editorTheme || "one-dark");
          setFontSize(res.user.preferences.fontSize || 14);
          setTabSize(res.user.preferences.tabSize || 2);
          setShowLineNumbers(res.user.preferences.showLineNumbers !== false);
          setAutoSave(res.user.preferences.autoSave !== false);
          setEmailNotifications(Boolean(res.user.preferences.emailNotifications));
          setProductUpdates(res.user.preferences.productUpdates !== false);
        }

        // Cargar Passkeys
        try {
          const pkRes = await fetch("/api/auth/passkeys");
          if (pkRes.ok) {
            const pkData = await pkRes.json();
            setPasskeys(pkData.passkeys || []);
          }
        } catch {}

        // Cargar 2FA status
        try {
          const tRes = await fetch("/api/auth/2fa");
          if (tRes.ok) {
            const tData = await tRes.json();
            setTotpEnabled(Boolean(tData.enabled));
          }
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSavePreferences = async () => {
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            theme: "dark",
            editorTheme,
            fontSize,
            tabSize,
            showLineNumbers,
            autoSave,
            emailNotifications,
            productUpdates,
          },
        }),
      });
      if (res.ok) {
        showNotification("Preferencias guardadas ✓");
      }
    } catch {
      alert("Error al guardar preferencias");
    }
  };

  // WebAuthn Passkey Registration
  const handleRegisterPasskey = async () => {
    setRegisteringPasskey(true);
    try {
      const optRes = await fetch("/api/auth/passkeys/register");
      if (!optRes.ok) {
        const d = await optRes.json();
        throw new Error(d.error || "No se pudieron obtener opciones de registro");
      }
      const options = await optRes.json();

      const regResp = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/passkeys/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationResponse: regResp,
          name: newPasskeyName.trim() || "Llave biométrica",
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Fallo al verificar passkey");

      setPasskeys((prev) => [...prev, verifyData.passkey]);
      setNewPasskeyName("");
      showNotification("¡Passkey registrada exitosamente! ✓");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar passkey";
      alert(msg);
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    if (!confirm("¿Eliminar esta Passkey de tu cuenta?")) return;
    try {
      const res = await fetch(`/api/auth/passkeys?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPasskeys(passkeys.filter((p) => p.id !== id));
        showNotification("Passkey eliminada ✓");
      }
    } catch {
      alert("Error al eliminar passkey");
    }
  };

  // Iniciar configuración 2FA
  const handleStart2FA = async () => {
    try {
      const res = await fetch("/api/auth/2fa");
      const data = await res.json();
      if (data.secret && data.otpauthUrl) {
        setSetup2FAData({ secret: data.secret, otpauthUrl: data.otpauthUrl });
      }
    } catch {
      alert("Error al generar clave 2FA");
    }
  };

  // Confirmar activación 2FA
  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setup2FAData || !verifyToken) return;

    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: verifyToken.trim(),
          secret: setup2FAData.secret,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código incorrecto");

      setTotpEnabled(true);
      setSetup2FAData(null);
      setRecoveryCodes(data.recoveryCodes || []);
      showNotification("¡2FA activado con éxito! Guarda tus códigos de recuperación.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al activar 2FA";
      alert(msg);
    }
  };

  // Desactivar 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode) return;
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationCode: disableCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código incorrecto");

      setTotpEnabled(false);
      setDisableCode("");
      showNotification("2FA desactivado ✓");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al desactivar 2FA";
      alert(msg);
    }
  };

  // Exportar datos
  const handleExportData = () => {
    window.location.href = "/api/account?action=export";
  };

  // Borrar cuenta
  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmUser !== user.username) {
      alert(`Debes escribir exactamente "${user.username}" para confirmar`);
      return;
    }

    if (!confirm("ADVERTENCIA FINAL: ¿Confirmas el borrado irrevocable de toda tu cuenta y proyectos?")) {
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationUsername: deleteConfirmUser }),
      });
      if (res.ok) {
        alert("Cuenta eliminada correctamente");
        window.location.href = "/";
      } else {
        const d = await res.json();
        alert(d.error || "No se pudo eliminar la cuenta");
      }
    } catch {
      alert("Error al eliminar la cuenta");
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <AccountLayoutShell
        title="Configuración"
        description="Cargando configuración de la cuenta..."
      >
        <div className="py-20 text-center font-mono text-xs text-zinc-500 animate-pulse">
          Cargando configuración...
        </div>
      </AccountLayoutShell>
    );
  }

  if (!user) {
    return (
      <AccountLayoutShell
        title="Acceso Requerido"
        description="Inicia sesión para gestionar tu configuración"
      >
        <div className="py-16 text-center max-w-sm mx-auto font-mono space-y-4">
          <p className="text-zinc-400 text-xs">
            Inicia sesión con Passkey o GitHub para ver y editar tu configuración.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-neon-green text-black font-bold text-xs hover:bg-[#00e67a] transition-all"
          >
            Iniciar Sesión
          </Link>
        </div>
      </AccountLayoutShell>
    );
  }

  return (
    <AccountLayoutShell
      activeTab="configuracion"
      username={user.username}
      title="Configuración de Cuenta"
      description="Gestiona seguridad sin contraseñas, passkeys, 2FA, preferencias y exportación de datos."
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-neon-green text-black font-mono font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-mono text-xs">
        {/* Sidebar interna de navegación de configuración */}
        <aside className="md:col-span-3 space-y-1">
          <button
            onClick={() => setActiveSection("cuenta")}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2.5 ${
              activeSection === "cuenta"
                ? "bg-neon-green/10 text-neon-green font-bold border border-neon-green/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cuenta</span>
          </button>

          <button
            onClick={() => setActiveSection("seguridad")}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2.5 ${
              activeSection === "seguridad"
                ? "bg-neon-green/10 text-neon-green font-bold border border-neon-green/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Seguridad & Passkeys</span>
          </button>

          <button
            onClick={() => setActiveSection("apariencia")}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2.5 ${
              activeSection === "apariencia"
                ? "bg-neon-green/10 text-neon-green font-bold border border-neon-green/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Editor & Apariencia</span>
          </button>

          <button
            onClick={() => setActiveSection("privacidad")}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2.5 ${
              activeSection === "privacidad"
                ? "bg-neon-green/10 text-neon-green font-bold border border-neon-green/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Privacidad</span>
          </button>

          <button
            onClick={() => setActiveSection("notificaciones")}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2.5 ${
              activeSection === "notificaciones"
                ? "bg-neon-green/10 text-neon-green font-bold border border-neon-green/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notificaciones</span>
          </button>

          <button
            onClick={() => setActiveSection("datos")}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2.5 ${
              activeSection === "datos"
                ? "bg-rose-950/40 text-rose-300 font-bold border border-rose-800/40"
                : "text-zinc-400 hover:text-rose-400 hover:bg-zinc-900"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Datos & Peligro</span>
          </button>
        </aside>

        {/* Panel Central */}
        <div className="md:col-span-9 space-y-6">
          {/* SECCIÓN CUENTA */}
          {activeSection === "cuenta" && (
            <div className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-zinc-800/80 pb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-neon-green" />
                <span>Datos Básicos de la Cuenta</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 mb-1">Nombre de Usuario</label>
                  <input
                    type="text"
                    value={user.username}
                    disabled
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Correo Electrónico Principal</label>
                  <input
                    type="text"
                    value={user.email || "No provisto"}
                    disabled
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Tu correo nunca se expone en perfiles públicos.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/perfil"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold border border-zinc-700 transition-colors"
                  >
                    <span>Editar Biografía y Enlaces en Perfil →</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN SEGURIDAD */}
          {activeSection === "seguridad" && (
            <div className="space-y-6">
              {/* Regla Zero Contraseñas */}
              <div className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-3">
                  <Shield className="w-4 h-4 text-neon-cyan" />
                  <span>Modelo de Acceso (Cero Contraseñas)</span>
                </div>
                <p className="text-zinc-400 leading-relaxed font-sans">
                  Broslunas Playground utiliza una arquitectura <strong>passwordless</strong>: nunca
                  almacenamos contraseñas de usuarios. Puedes acceder con tu huella/FaceID mediante{" "}
                  <strong className="text-white">Passkeys (WebAuthn)</strong> o autenticarte con tu cuenta de{" "}
                  <strong className="text-white">GitHub</strong>.
                </p>
              </div>

              {/* Gestión de Passkeys */}
              <div className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <KeyRound className="w-4 h-4 text-neon-green" />
                    <span>Passkeys Vinculadas ({passkeys.length})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPasskeyName}
                    onChange={(e) => setNewPasskeyName(e.target.value)}
                    placeholder="Nombre descriptivo (ej. MacBook TouchID, iPhone)"
                    maxLength={40}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-zinc-700/80 focus:border-neon-green focus:outline-none text-zinc-200"
                  />
                  <button
                    type="button"
                    onClick={handleRegisterPasskey}
                    disabled={registeringPasskey}
                    className="px-4 py-2 rounded-lg bg-neon-green hover:bg-[#00e67a] text-black font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{registeringPasskey ? "Registrando..." : "Crear Passkey"}</span>
                  </button>
                </div>

                {passkeys.length === 0 ? (
                  <p className="text-zinc-500 py-2">
                    No tienes Passkeys registradas aún. Añade una para iniciar sesión en 1 segundo sin GitHub.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {passkeys.map((pk) => (
                      <div
                        key={pk.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-zinc-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <KeyRound className="w-4 h-4 text-neon-green" />
                          <div>
                            <div className="font-bold text-zinc-200">{pk.name}</div>
                            <div className="text-[10px] text-zinc-500">
                              Creada el {new Date(pk.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePasskey(pk.id)}
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                          title="Eliminar passkey"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Autenticación en Dos Pasos (2FA / TOTP) */}
              <div className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Autenticación en Dos Pasos (TOTP)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      totpEnabled
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                    }`}
                  >
                    {totpEnabled ? "Activado" : "Desactivado"}
                  </span>
                </div>

                {!totpEnabled ? (
                  <div>
                    {!setup2FAData ? (
                      <div className="space-y-3">
                        <p className="text-zinc-400 font-sans">
                          Añade una capa extra de protección con Google Authenticator, Authy o 1Password.
                        </p>
                        <button
                          type="button"
                          onClick={handleStart2FA}
                          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold border border-zinc-700 transition-colors"
                        >
                          Configurar 2FA con App
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleConfirm2FA} className="space-y-4 p-4 rounded-xl bg-black/60 border border-zinc-800">
                        <div className="font-bold text-white">1. Escanea el código QR con tu aplicación:</div>
                        <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl gap-3">
                          <QrCode value={setup2FAData.otpauthUrl} size={192} />
                          <p className="text-[11px] text-zinc-400 font-sans text-center max-w-xs">
                            Usa Google Authenticator, Microsoft Authenticator, 1Password o Authy.
                          </p>
                          <a
                            href={setup2FAData.otpauthUrl}
                            className="text-[11px] text-neon-green hover:underline sm:hidden"
                          >
                            Abrir directamente en tu app
                          </a>
                        </div>

                        <details className="text-[11px] text-zinc-500 group">
                          <summary className="cursor-pointer hover:text-zinc-300 font-sans transition-colors select-none">
                            ¿No puedes escanear? Configuración manual
                          </summary>
                          <div className="mt-2 space-y-1">
                            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-neon-green select-all tracking-wider text-center text-xs">
                              {setup2FAData.secret}
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              Introduce esta clave secreta manualmente si tu cámara no está disponible.
                            </p>
                          </div>
                        </details>

                        <div className="font-bold text-white pt-2">2. Introduce el código de 6 dígitos:</div>
                        <input
                          type="text"
                          maxLength={6}
                          value={verifyToken}
                          onChange={(e) => setVerifyToken(e.target.value)}
                          placeholder="123456"
                          className="w-full text-center text-lg tracking-widest px-3 py-2 rounded-lg bg-black border border-zinc-700 focus:border-neon-green focus:outline-none text-white font-bold"
                          required
                        />

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-neon-green text-black font-bold hover:bg-[#00e67a]"
                          >
                            Verificar y Activar
                          </button>
                          <button
                            type="button"
                            onClick={() => setSetup2FAData(null)}
                            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleDisable2FA} className="space-y-3">
                    <p className="text-zinc-400 font-sans">
                      El segundo factor está activo en cada inicio de sesión con GitHub o Passkey.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value)}
                        placeholder="Código TOTP o de recuperación"
                        className="px-3 py-2 rounded-lg bg-black/60 border border-zinc-700 focus:border-red-500 focus:outline-none text-zinc-200"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900 font-bold"
                      >
                        Desactivar 2FA
                      </button>
                    </div>
                  </form>
                )}

                {/* Mostrar códigos de recuperación si acaban de generarse */}
                {recoveryCodes.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Códigos de Recuperación de Un Solo Uso</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 font-sans">
                      Guarda estos códigos en un lugar seguro. Solo se muestran ahora:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-white text-center font-bold">
                      {recoveryCodes.map((c, i) => (
                        <div key={i} className="p-2 rounded bg-black/60 border border-amber-900/60 select-all">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-sans flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    Si pierdes acceso a tu dispositivo 2FA y no tienes códigos, contacta a{" "}
                    <a href="mailto:info@broslunas.com" className="text-neon-cyan underline">
                      info@broslunas.com
                    </a>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN APARIENCIA & EDITOR */}
          {activeSection === "apariencia" && (
            <div className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-zinc-800/80 pb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-neon-green" />
                <span>Preferencias de Entorno y Editor</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 mb-1">Tema del Editor</label>
                  <select
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-zinc-700/80 text-zinc-200"
                  >
                    <option value="one-dark">One Dark (Terminal Default)</option>
                    <option value="dracula">Dracula Dark</option>
                    <option value="nord">Nord Frost</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">Tamaño de Fuente ({fontSize}px)</label>
                    <input
                      type="range"
                      min={12}
                      max={20}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-[#00ff88]"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Tabulación (Espacios)</label>
                    <select
                      value={tabSize}
                      onChange={(e) => setTabSize(Number(e.target.value) as 2 | 4)}
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-zinc-700/80 text-zinc-200"
                    >
                      <option value={2}>2 espacios</option>
                      <option value={4}>4 espacios</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLineNumbers}
                      onChange={(e) => setShowLineNumbers(e.target.checked)}
                      className="accent-[#00ff88]"
                    />
                    <span className="text-zinc-300">Mostrar números de línea en gutter</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      className="accent-[#00ff88]"
                    />
                    <span className="text-zinc-300">Autoguardado continuo al editar código</span>
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="px-5 py-2 rounded-xl bg-neon-green hover:bg-[#00e67a] text-black font-bold transition-all"
                  >
                    Guardar Preferencias
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN PRIVACIDAD */}
          {activeSection === "privacidad" && (
            <div className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-zinc-800/80 pb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-neon-cyan" />
                <span>Privacidad de la Cuenta</span>
              </h2>

              <p className="text-zinc-400 font-sans">
                Puedes cambiar si tu perfil es indexable, ocultarlo con acceso solo por enlace directo,
                o volverlo 100% privado en cualquier momento desde la página de perfil.
              </p>

              <div className="pt-2">
                <Link
                  href="/perfil"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold border border-zinc-700"
                >
                  <span>Gestionar Visibilidad en Mi Perfil →</span>
                </Link>
              </div>
            </div>
          )}

          {/* SECCIÓN NOTIFICACIONES */}
          {activeSection === "notificaciones" && (
            <div className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-zinc-800/80 pb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Preferencias de Comunicación</span>
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="accent-[#00ff88]"
                  />
                  <div>
                    <div className="font-bold text-zinc-200">Avisos de Seguridad y Accesos</div>
                    <div className="text-[10px] text-zinc-500">
                      Notificaciones críticas cuando se active 2FA o se registre una nueva Passkey.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productUpdates}
                    onChange={(e) => setProductUpdates(e.target.checked)}
                    className="accent-[#00ff88]"
                  />
                  <div>
                    <div className="font-bold text-zinc-200">Actualizaciones de Runtimes y Compiladores</div>
                    <div className="text-[10px] text-zinc-500">
                      Novedades sobre nuevas versiones de GCC, Clang, CPython y WebAssembly.
                    </div>
                  </div>
                </label>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="px-5 py-2 rounded-xl bg-neon-green hover:bg-[#00e67a] text-black font-bold"
                  >
                    Guardar Notificaciones
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN DATOS Y ZONA DE PELIGRO */}
          {activeSection === "datos" && (
            <div className="space-y-6">
              {/* Exportar datos */}
              <div className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-neon-green" />
                  <span>Exportar tus Datos (RGPD / Portabilidad)</span>
                </h2>
                <p className="text-zinc-400 font-sans text-[11px]">
                  Descarga un archivo JSON completo con tu información de usuario, proyectos,
                  código fuente y configuraciones.
                </p>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold border border-zinc-700 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo JSON de la Cuenta</span>
                </button>
              </div>

              {/* Eliminar cuenta */}
              <div className="bg-rose-950/20 border border-rose-900/60 rounded-xl p-5 sm:p-6 space-y-4">
                <h2 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Zona de Peligro: Eliminar Cuenta Permanentemente</span>
                </h2>
                <p className="text-zinc-400 font-sans text-[11px]">
                  Esta acción es irreversible: eliminará tus credenciales, proyectos de la base de datos
                  y todos tus ficheros en Cloudflare R2.
                </p>

                <div className="space-y-2">
                  <label className="block text-zinc-400 text-[11px]">
                    Escribe tu nombre de usuario (<strong>{user.username}</strong>) para confirmar:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmUser}
                    onChange={(e) => setDeleteConfirmUser(e.target.value)}
                    placeholder={user.username}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-rose-900 focus:border-rose-500 focus:outline-none text-rose-200"
                  />
                </div>

                <button
                  type="button"
                  disabled={deleteConfirmUser !== user.username || deletingAccount}
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all"
                >
                  {deletingAccount ? "Eliminando..." : "Eliminar Cuenta y Proyectos Definitivamente"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AccountLayoutShell>
  );
}
