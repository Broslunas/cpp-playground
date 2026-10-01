"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AccountLayoutShell } from "@/components/account/AccountLayoutShell";
import { AuthUser, Project } from "@/types";
import { fetchAuthStatus, fetchCloudProjects } from "@/lib/cloud-projects";
import {
  User,
  Globe,
  Share2,
  Check,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Code2,
  Lock,
  Eye,
  FolderOpen,
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Profile Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [availableForCollaboration, setAvailable] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [showActivity, setShowActivity] = useState(true);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [newColName, setNewColName] = useState("");

  useEffect(() => {
    fetchAuthStatus().then(async (res) => {
      if (res.user) {
        setUser(res.user);
        setName(res.user.name || "");
        setBio(res.user.bio || "");
        setWebsite(res.user.website || "");
        setAvailable(res.user.availableForCollaboration ?? true);
        setProfileVisibility(res.user.profileVisibility || "public");
        setShowActivity(res.user.showActivity ?? true);
        setFeaturedIds(res.user.featuredProjectIds || []);
        setCollections(res.user.collections || []);

        const cloud = await fetchCloudProjects();
        setProjects(cloud);
      }
      setLoading(false);
    });
  }, []);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          website,
          availableForCollaboration,
          profileVisibility,
          showActivity,
          featuredProjectIds: featuredIds,
          collections,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el perfil");
      }

      showNotification("Perfil actualizado correctamente ✓");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleFeaturedProject = (projectId: string) => {
    if (featuredIds.includes(projectId)) {
      setFeaturedIds(featuredIds.filter((id) => id !== projectId));
    } else {
      if (featuredIds.length >= 6) {
        alert("Máximo 6 proyectos destacados permitidos en el perfil");
        return;
      }
      setFeaturedIds([...featuredIds, projectId]);
    }
  };

  const handleUpdateProjectVisibility = async (project: Project, visibility: "public" | "unlisted" | "private", publicCode: boolean) => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility, publicCode }),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, visibility, publicCode } : p))
        );
        showNotification(`Proyecto "${project.name}" actualizado ✓`);
      }
    } catch {
      alert("Error al actualizar visibilidad");
    }
  };

  const handleAddCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    setCollections([...collections, { id: crypto.randomUUID(), name: newColName.trim() }]);
    setNewColName("");
  };

  const handleRemoveCollection = (id: string) => {
    setCollections(collections.filter((c) => c.id !== id));
  };

  if (loading) {
    return (
      <AccountLayoutShell
        title="Mi Perfil"
        description="Cargando tus datos de cuenta..."
      >
        <div className="py-20 text-center font-mono text-xs text-zinc-500 animate-pulse">
          Cargando configuración de perfil...
        </div>
      </AccountLayoutShell>
    );
  }

  if (!user) {
    return (
      <AccountLayoutShell
        title="Acceso Requerido"
        description="Inicia sesión para gestionar tu perfil"
      >
        <div className="py-16 text-center max-w-sm mx-auto font-mono space-y-4">
          <p className="text-zinc-400 text-xs">
            Debes iniciar sesión con Passkey o GitHub para ver y editar tu perfil.
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
      activeTab="perfil"
      username={user.username}
      title="Mi Perfil"
      description="Personaliza tu presencia, proyectos destacados y visibilidad pública."
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-neon-green text-black font-mono font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* SECCIÓN 1: Tarjeta de Identidad */}
        <section className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
              <User className="w-4 h-4 text-neon-green" />
              <span>Información Pública de la Cuenta</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Identidad @{user.username}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-2xl border-2 border-neon-green/50 object-cover shadow-lg"
                  unoptimized
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-xl font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-[10px] font-mono text-zinc-500">Sincronizado vía GitHub</span>
            </div>

            {/* Campos de texto */}
            <div className="flex-1 w-full space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Nombre Visible</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    placeholder="Tu nombre o alias"
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-zinc-700/80 focus:border-neon-green focus:outline-none text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Nombre de Usuario (@)</label>
                  <input
                    type="text"
                    value={user.username}
                    disabled
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                    title="El usuario proviene de GitHub / passkey"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">
                  Biografía Corta <span className="text-zinc-600 font-normal">({bio.length}/240)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={240}
                  rows={2}
                  placeholder="Programador C++, amante de sistemas y algoritmos..."
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-zinc-700/80 focus:border-neon-green focus:outline-none text-zinc-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Sitio Web Personal o Portafolio</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://tudominio.com"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-zinc-700/80 focus:border-neon-green focus:outline-none text-zinc-200"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: Privacidad y Visibilidad del Perfil */}
        <section className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Globe className="w-4 h-4 text-neon-cyan" />
              <span>Visibilidad y Estado Público</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Opción 1: Público */}
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                profileVisibility === "public"
                  ? "border-neon-green bg-neon-green/10 text-white"
                  : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-zinc-100">Público</span>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={profileVisibility === "public"}
                  onChange={() => setProfileVisibility("public")}
                  className="accent-[#00ff88]"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Visible en <code>/u/{user.username}</code> e indexable en exploradores.
              </p>
            </label>

            {/* Opción 2: Solo Enlace */}
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                profileVisibility === "unlisted"
                  ? "border-amber-400 bg-amber-400/10 text-white"
                  : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-zinc-100">Solo Enlace</span>
                <input
                  type="radio"
                  name="visibility"
                  value="unlisted"
                  checked={profileVisibility === "unlisted"}
                  onChange={() => setProfileVisibility("unlisted")}
                  className="accent-[#facc15]"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Solo accesible si compartes tu URL directa. Oculto para motores de búsqueda.
              </p>
            </label>

            {/* Opción 3: Privado */}
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                profileVisibility === "private"
                  ? "border-rose-500 bg-rose-500/10 text-white"
                  : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-zinc-100">Privado</span>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={profileVisibility === "private"}
                  onChange={() => setProfileVisibility("private")}
                  className="accent-[#ef4444]"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Nadie podrá ver tu perfil público. La URL devolverá página no encontrada.
              </p>
            </label>
          </div>

          {/* Badges de Colaboración y Actividad */}
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-zinc-800 cursor-pointer hover:border-zinc-700">
              <input
                type="checkbox"
                checked={availableForCollaboration}
                onChange={(e) => setAvailable(e.target.checked)}
                className="w-4 h-4 accent-[#00ff88]"
              />
              <div>
                <div className="font-semibold text-zinc-200">Disponible para colaborar</div>
                <div className="text-[10px] text-zinc-500">
                  Muestra el distintivo verde de disponibilidad en tu perfil público.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-zinc-800 cursor-pointer hover:border-zinc-700">
              <input
                type="checkbox"
                checked={showActivity}
                onChange={(e) => setShowActivity(e.target.checked)}
                className="w-4 h-4 accent-[#00ff88]"
              />
              <div>
                <div className="font-semibold text-zinc-200">Mostrar actividad reciente</div>
                <div className="text-[10px] text-zinc-500">
                  Muestra estadísticas públicas de proyectos actualizados.
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* SECCIÓN 3: Proyectos Destacados y Control de Código Público */}
        <section className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Code2 className="w-4 h-4 text-neon-green" />
                <span>Proyectos Destacados en Perfil ({featuredIds.length}/6)</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Para que un proyecto aparezca en tu perfil público, debes marcarlo como <strong>Público</strong>.
                Decide además si permites ver el código fuente completo a los visitantes.
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="p-4 rounded-lg bg-black/40 border border-zinc-800 text-center text-zinc-500">
              No tienes proyectos en la nube todavía. Crea o sincroniza uno en el Playground.
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((proj) => {
                const isFeatured = featuredIds.includes(proj.id);
                const isPublic = proj.visibility === "public";
                const allowsCode = Boolean(proj.publicCode);

                return (
                  <div
                    key={proj.id}
                    className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isFeatured
                        ? "border-neon-green/60 bg-neon-green/5"
                        : "border-zinc-800 bg-black/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleFeaturedProject(proj.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                          isFeatured
                            ? "bg-neon-green text-black border-neon-green"
                            : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white"
                        }`}
                      >
                        {isFeatured ? "★ Destacado" : "☆ Destacar"}
                      </button>
                      <div>
                        <div className="font-bold text-zinc-200 flex items-center gap-2">
                          <span>{proj.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 uppercase">
                            {proj.language || "cpp"}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {isPublic ? "Visible públicamente" : "Privado (solo tú)"}
                        </div>
                      </div>
                    </div>

                    {/* Controles de visibilidad del proyecto y de código */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={proj.visibility || "private"}
                        onChange={(e) =>
                          handleUpdateProjectVisibility(
                            proj,
                            e.target.value as "public" | "unlisted" | "private",
                            allowsCode
                          )
                        }
                        className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] focus:outline-none"
                      >
                        <option value="private">Privado</option>
                        <option value="unlisted">No listado (solo URL)</option>
                        <option value="public">Público (perfil)</option>
                      </select>

                      <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowsCode}
                          onChange={(e) =>
                            handleUpdateProjectVisibility(
                              proj,
                              proj.visibility || "private",
                              e.target.checked
                            )
                          }
                          className="accent-[#00ff88]"
                        />
                        <span>Exponer código fuente</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECCIÓN 4: Colecciones Personales */}
        <section className="bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Colecciones y Carpetas Públicas</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="Ej. Algoritmos DSA, Proyectos C++23..."
              maxLength={30}
              className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-zinc-700/80 focus:border-neon-green focus:outline-none text-zinc-200"
            />
            <button
              type="button"
              onClick={handleAddCollection}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Colección</span>
            </button>
          </div>

          {collections.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {collections.map((col) => (
                <span
                  key={col.id}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-300 flex items-center gap-2"
                >
                  <span>{col.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCollection(col.id)}
                    className="text-zinc-500 hover:text-red-400"
                    title="Eliminar colección"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Botón de Guardar fijo */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-neon-green hover:bg-[#00e67a] active:bg-[#00cc6c] text-black font-bold font-mono text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Guardando..." : "Guardar Cambios del Perfil"}</span>
          </button>
        </div>
      </form>
    </AccountLayoutShell>
  );
}
