"use client";

import React from "react";
import { Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";
import { CloudSyncState } from "@/types";

interface CloudSyncStatusProps {
  status: CloudSyncState;
  onManualSync?: () => void;
  isLoggedIn?: boolean;
}

export function CloudSyncStatus({
  status,
  onManualSync,
  isLoggedIn = false,
}: CloudSyncStatusProps) {
  if (!isLoggedIn) {
    return (
      <button
        onClick={onManualSync}
        type="button"
        className="text-zinc-600 hover:text-zinc-400 p-1 rounded transition-colors flex items-center"
        title="Modo local: inicia sesión con GitHub para sincronizar en la nube"
        aria-label="Modo local"
      >
        <CloudOff className="w-3.5 h-3.5" />
      </button>
    );
  }

  const configs: Record<
    CloudSyncState,
    { icon: React.ReactNode; title: string }
  > = {
    synced: {
      icon: (
        <span className="relative flex items-center text-zinc-400 hover:text-zinc-200">
          <Cloud className="w-3.5 h-3.5" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-neon-green ring-1 ring-zinc-950" />
        </span>
      ),
      title: "Sincronizado en la nube (MongoDB + R2). Clic para forzar guardado.",
    },
    saving: {
      icon: <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />,
      title: "Subiendo cambios a la nube...",
    },
    idle: {
      icon: (
        <span className="relative flex items-center text-zinc-400 hover:text-zinc-200">
          <Cloud className="w-3.5 h-3.5" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-neon-green ring-1 ring-zinc-950" />
        </span>
      ),
      title: "Conectado a la nube. Clic para sincronizar.",
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
      title: "Error al sincronizar con la nube (guardado en local). Clic para reintentar.",
    },
    offline: {
      icon: <CloudOff className="w-3.5 h-3.5 text-zinc-500" />,
      title: "Sin conexión a internet. Guardado local.",
    },
  };

  const current = configs[status] || configs.idle;

  return (
    <button
      onClick={onManualSync}
      type="button"
      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors flex items-center"
      title={current.title}
      aria-label="Estado de sincronización"
    >
      {current.icon}
    </button>
  );
}
