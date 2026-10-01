"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#090a0f] text-zinc-200 px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-neon-green mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-2">Página no encontrada</h2>
        <p className="text-zinc-400 mb-8 max-w-md">
          La página que buscas no existe. Verifica la URL o regresa al inicio.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="px-6 py-3 bg-neon-green text-black font-semibold rounded hover:bg-neon-green/80 transition"
          >
            Ir al inicio
          </Link>
          <Link
            href="/cpp"
            className="px-6 py-3 border border-neon-green text-neon-green font-semibold rounded hover:bg-neon-green/10 transition"
          >
            Ir al playground
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-zinc-500 text-sm">
        ejecuta.tech
      </div>
    </div>
  );
}
