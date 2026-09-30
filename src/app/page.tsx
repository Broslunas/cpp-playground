import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TerminalShowcase } from "@/components/landing/TerminalShowcase";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Play, Sparkles, Terminal, Code2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#08090f] text-zinc-100 selection:bg-neon-green/30 selection:text-white">
      <Navbar />

      <main id="main-content" className="flex-1">
        <Hero />
        <TerminalShowcase />
        <Features />

        {/* Quick CTA banner before footer */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-neon-green/30 bg-gradient-to-r from-zinc-950 via-[#0a1219] to-zinc-950 p-8 sm:p-12 text-center shadow-[0_0_50px_rgba(0,255,136,0.1)]">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-72 h-72 bg-neon-green/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-72 h-72 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-neon-green/10 text-neon-green border border-neon-green/20">
                <Sparkles className="w-3.5 h-3.5" /> Comienza en 1 Segundo
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                Entra a Broslunas Playground
              </h3>
              <p className="text-zinc-400 text-sm sm:text-base font-sans">
                Sin descargas, sin instalaciones y sin tarjetas de crédito. Abre tu editor en el navegador y empieza a compilar.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/playground"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-green text-black font-mono font-bold text-sm hover:bg-[#00e67a] transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Lanzar Entornos Ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cpp/playground"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-sm hover:text-white hover:border-zinc-500 transition-all"
                >
                  <Terminal className="w-4 h-4 text-neon-green" />
                  <span>Probar C++23 Directo</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
