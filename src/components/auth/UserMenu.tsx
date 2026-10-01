"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { LogIn, LogOut, Cloud, Database, HardDrive, User, ChevronDown } from "lucide-react";
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
  const [configured, setConfigured] = useState({
    github: false,
    mongodb: false,
    r2: false,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetchAuthStatus().then((res) => {
      if (!mounted) return;
      setUser(res.user);
      setConfigured(res.configured);
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
      <a
        href="/api/auth/github/login"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-neon-green/50 text-zinc-200 hover:text-white font-mono text-xs transition-all shadow-sm group"
        title="Inicia sesión con GitHub para sincronizar tu código en la nube (MongoDB + R2)"
      >
        <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
        <span>{compact ? "Login" : "Conectar GitHub"}</span>
      </a>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 transition-all font-mono text-xs text-zinc-200"
      >
        <div className="relative">
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
        <span className="font-semibold text-zinc-200 max-w-[110px] truncate">
          {user.username}
        </span>
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs">
          {/* User info */}
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.username}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full border border-neon-green/40"
                unoptimized
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
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

          {/* Cloud sync stats / status */}
          <div className="py-2.5 space-y-1.5 border-b border-zinc-800/80 text-[11px]">
            <div className="text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-neon-green" />
              <span>Servicios Conectados</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" /> MongoDB
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${configured.mongodb ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60" : "bg-zinc-800 text-zinc-400"}`}>
                {configured.mongodb ? "Conectado" : "Pendiente URI"}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-cyan-400" /> Cloudflare R2
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${configured.r2 ? "bg-cyan-950/80 text-cyan-400 border border-cyan-800/60" : "bg-zinc-800 text-zinc-400"}`}>
                {configured.r2 ? "Conectado" : "Pendiente R2"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
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
