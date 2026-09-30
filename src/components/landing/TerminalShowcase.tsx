import React from "react";
import Link from "next/link";
import { Play, CheckCircle2, CornerDownLeft } from "lucide-react";

export function TerminalShowcase() {
  return (
    <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e14] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Window title bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#08090d] border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs font-mono text-zinc-400">
              main.cc — g++ -std=c++23 -O2
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">
              ONLINE
            </span>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm text-zinc-300 leading-relaxed overflow-x-auto">
          <pre>
            <span className="text-zinc-500">1</span>  <span className="text-neon-cyan">#include</span> <span className="text-emerald-400">&lt;iostream&gt;</span>{"\n"}
            <span className="text-zinc-500">2</span>  <span className="text-neon-cyan">#include</span> <span className="text-emerald-400">&lt;vector&gt;</span>{"\n"}
            <span className="text-zinc-500">3</span>  <span className="text-neon-cyan">#include</span> <span className="text-emerald-400">&lt;ranges&gt;</span>{"\n"}
            <span className="text-zinc-500">4</span>  {"\n"}
            <span className="text-zinc-500">5</span>  <span className="text-neon-green">int</span> <span className="text-blue-400">main</span>() {"{"}{"\n"}
            <span className="text-zinc-500">6</span>      <span className="text-purple-400">std::vector</span>&lt;<span className="text-neon-green">int</span>&gt; nums = {"{1, 2, 3, 4, 5}"};{"\n"}
            <span className="text-zinc-500">7</span>      {"\n"}
            <span className="text-zinc-500">8</span>      <span className="text-zinc-500">{"// Modern C++20 Ranges pipeline"}</span>{"\n"}
            <span className="text-zinc-500">9</span>      <span className="text-purple-400">auto</span> evens = nums | std::views::filter([](<span className="text-neon-green">int</span> n) {"{ return n % 2 == 0; }"});{"\n"}
            <span className="text-zinc-500">10</span>     <span className="text-purple-400">for</span> (<span className="text-neon-green">int</span> n : evens) {"{"}{"\n"}
            <span className="text-zinc-500">11</span>         <span className="text-purple-400">std::cout</span> &lt;&lt; <span className="text-amber-300">&quot;Par: &quot;</span> &lt;&lt; n &lt;&lt; <span className="text-amber-300">&quot;\\n&quot;</span>;{"\n"}
            <span className="text-zinc-500">12</span>     {"}"}{"\n"}
            <span className="text-zinc-500">13</span>     <span className="text-purple-400">return</span> <span className="text-emerald-400">0</span>;{"\n"}
            <span className="text-zinc-500">14</span> {"}"}
          </pre>
        </div>

        {/* Output Panel Showcase */}
        <div className="border-t border-zinc-800 bg-[#07080b] p-4 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="flex items-center gap-1.5 text-zinc-400 font-semibold">
              <CornerDownLeft className="w-3.5 h-3.5 text-neon-green" /> SALIDA DEL PROGRAMA (stdout)
            </span>
            <span className="text-neon-green flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Exit Code: 0 (0.12s)
            </span>
          </div>
          <div className="bg-black/60 rounded p-3 text-neon-green space-y-1">
            <p>Par: 2</p>
            <p>Par: 4</p>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="px-4 py-3 bg-[#0a0d13] border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">
            Pruébalo con tu propio código C++
          </span>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono font-semibold hover:bg-neon-green hover:text-black transition-all"
          >
            <Play className="w-3 h-3 fill-current" />
            Ejecutar Ahora
          </Link>
        </div>
      </div>
    </section>
  );
}
