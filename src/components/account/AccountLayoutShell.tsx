import React from "react";
import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";
import { Terminal, ArrowLeft, User, Settings, Globe } from "lucide-react";

interface AccountLayoutShellProps {
  children: React.ReactNode;
  activeTab?: "perfil" | "configuracion";
  username?: string;
  title: string;
  description: string;
}

export function AccountLayoutShell({
  children,
  activeTab = "perfil",
  username,
  title,
  description,
}: AccountLayoutShellProps) {
  return (
    <div className="min-h-screen bg-[#08090f] text-zinc-100 flex flex-col font-sans selection:bg-neon-green/30 selection:text-white">
      {/* Navbar Superior Unificada */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#08090f]/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800/70 border border-transparent hover:border-zinc-700 transition-colors"
              title="Volver al playground"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-neon-green" />
              <span>Playground</span>
            </Link>
            <div className="h-4 w-[1px] bg-zinc-800" />
            <Link href="/" className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs tracking-wide text-zinc-200">
                Broslunas <span className="text-neon-green">Playground</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <UserMenu compact />
          </div>
        </div>
      </header>

      {/* Cabecera de Página */}
      <div className="border-b border-zinc-800/80 bg-gradient-to-b from-zinc-950/80 to-[#08090f]/50">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-mono">
                {description}
              </p>
            </div>

            {username && (
              <Link
                href={`/u/${encodeURIComponent(username)}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neon-cyan/40 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan text-xs font-mono transition-colors self-start sm:self-auto"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Ver perfil público (/u/{username})</span>
              </Link>
            )}
          </div>

          {/* Pestañas de navegación de cuenta */}
          <nav className="flex items-center gap-2 mt-6 border-b border-zinc-800/60 font-mono text-xs">
            <Link
              href="/perfil"
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium transition-colors ${
                activeTab === "perfil"
                  ? "border-neon-green text-neon-green bg-zinc-900/40"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Perfil</span>
            </Link>

            <Link
              href="/configuracion"
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium transition-colors ${
                activeTab === "configuracion"
                  ? "border-neon-green text-neon-green bg-zinc-900/40"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuración</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
