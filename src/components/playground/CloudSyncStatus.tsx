"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Cloud,
  CloudOff,
  Loader2,
  AlertCircle,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Check,
} from "lucide-react";
import { CloudSyncState } from "@/types";

interface CloudSyncStatusProps {
  status: CloudSyncState;
  onPull?: () => void;
  onPush?: () => void;
  onBidirectionalSync?: () => void;
  isLoggedIn?: boolean;
}

export function CloudSyncStatus({
  status,
  onPull,
  onPush,
  onBidirectionalSync,
  isLoggedIn = false,
}: CloudSyncStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoggedIn) {
    return (
      <a
        href="/api/auth/github/login"
        className="text-zinc-600 hover:text-zinc-400 p-1 rounded transition-colors flex items-center"
        title="Modo local. Inicia sesión con GitHub para sincronizar en la nube (MongoDB + R2)"
        aria-label="Iniciar sesión para sincronizar en la nube"
      >
        <CloudOff className="w-3.5 h-3.5" />
      </a>
    );
  }

  const configs: Record<
    CloudSyncState,
    { icon: React.ReactNode; label: string; dotColor: string }
  > = {
    synced: {
      icon: (
        <span className="relative flex items-center text-zinc-400 hover:text-zinc-200">
          <Cloud className="w-3.5 h-3.5" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-neon-green ring-1 ring-zinc-950" />
        </span>
      ),
      label: "Sincronizado",
      dotColor: "bg-neon-green",
    },
    saving: {
      icon: <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />,
      label: "Sincronizando...",
      dotColor: "bg-cyan-400",
    },
    idle: {
      icon: (
        <span className="relative flex items-center text-zinc-400 hover:text-zinc-200">
          <Cloud className="w-3.5 h-3.5" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-zinc-500 ring-1 ring-zinc-950" />
        </span>
      ),
      label: "En la nube",
      dotColor: "bg-zinc-500",
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
      label: "Error de sync",
      dotColor: "bg-amber-400",
    },
    offline: {
      icon: <CloudOff className="w-3.5 h-3.5 text-zinc-500" />,
      label: "Sin conexión",
      dotColor: "bg-zinc-600",
    },
  };

  const current = configs[status] || configs.idle;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors flex items-center"
        title="Opciones de sincronización (Push / Pull)"
        aria-label="Opciones de sincronización en la nube"
      >
        {current.icon}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs">
          {/* Header Status */}
          <div className="px-2 py-1.5 border-b border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-300">Nube (MongoDB + R2)</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`} />
              <span className="text-[10px]">{current.label}</span>
            </div>
          </div>

          {/* Sync actions */}
          <div className="py-1 space-y-0.5">
            {/* Bidirectional Sync */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (onBidirectionalSync) onBidirectionalSync();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-250 hover:text-white hover:bg-zinc-900 transition-colors text-left"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neon-green" />
              <div className="flex flex-col">
                <span className="font-medium text-white">Sincronizar (Auto)</span>
                <span className="text-[10px] text-zinc-500">Reconcilia con la nube</span>
              </div>
            </button>

            {/* Push to cloud */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (onPush) onPush();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-250 hover:text-white hover:bg-zinc-900 transition-colors text-left"
            >
              <CloudUpload className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex flex-col">
                <span className="font-medium text-white">Push a la nube</span>
                <span className="text-[10px] text-zinc-500">Guarda en MongoDB + R2</span>
              </div>
            </button>

            {/* Pull from cloud */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (onPull) onPull();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-250 hover:text-white hover:bg-zinc-900 transition-colors text-left"
            >
              <CloudDownload className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="font-medium text-white">Pull de la nube</span>
                <span className="text-[10px] text-zinc-500">Recarga desde la nube</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
