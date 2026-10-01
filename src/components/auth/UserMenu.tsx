"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LogIn,
  LogOut,
  User,
  Settings,
  Globe,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { AuthUser } from "@/types";
import { fetchAuthStatus } from "@/lib/cloud-projects";

interface UserMenuProps {
  onUserChange?: (user: AuthUser | null) => void;
  compact?: boolean;
}

export function UserMenu({ onUserChange, compact = false }: UserMenuProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetchAuthStatus().then((res) => {
      if (!mounted) return;
      setUser(res.user);
      setLoading(false);
      if (onUserChange) onUserChange(res.user);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      mounted = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onUserChange]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setIsOpen(false);
    if (onUserChange) onUserChange(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs font-mono animate-pulse">
        <div className="w-4 h-4 rounded-full bg-zinc-800" />
        {!compact && <span>Cargando cuenta...</span>}
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-neon-green/50 text-zinc-200 hover:text-white font-mono text-xs transition-all shadow-sm group shrink-0"
        title="Iniciar sesión con Passkey o GitHub"
      >
        <LogIn className="w-3.5 h-3.5 text-neon-green transition-transform group-hover:scale-110 shrink-0" />
        <span className={compact ? "hidden min-[480px]:inline" : ""}>
          {compact ? "Entrar" : "Iniciar sesión"}
        </span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-2 pr-1.5 sm:pr-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 transition-all font-mono text-xs text-zinc-200 shrink-0"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menú de usuario"
      >
        <div className="relative shrink-0">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={22}
              height={22}
              className="w-5.5 h-5.5 rounded-full border border-neon-green/60 object-cover"
              unoptimized
            />
          ) : (
            <div className="w-5.5 h-5.5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-200">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-green ring-1 ring-zinc-950" />
        </div>
        <span
          className={`font-semibold text-zinc-200 max-w-[110px] truncate ${
            compact ? "hidden min-[480px]:inline" : ""
          }`}
        >
          {user.name || user.username}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-400 transition-transform shrink-0 ${
            isOpen ? "rotate-180 text-neon-green" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs">
          {/* Cabecera del usuario */}
          <div className="flex items-center gap-3 p-2.5 border-b border-zinc-800/80 mb-1">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.username}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full border border-neon-green/40 object-cover shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-zinc-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{user.name || user.username}</div>
              <div className="text-[11px] text-zinc-400 truncate">@{user.username}</div>
              {user.email && (
                <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
              )}
            </div>
          </div>

          {/* Enlaces de navegación */}
          <div className="py-1 space-y-0.5">
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-neon-green" />
              <span>Mi Perfil</span>
            </Link>

            <Link
              href={`/u/${encodeURIComponent(user.username)}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-3.5 h-3.5 text-neon-cyan" />
                <span>Perfil público</span>
              </div>
              <span className="text-[10px] text-zinc-500">/u/{user.username}</span>
            </Link>

            <Link
              href="/configuracion"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Configuración</span>
            </Link>
          </div>

          {/* Cerrar sesión */}
          <div className="pt-1 mt-1 border-t border-zinc-800/80">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
