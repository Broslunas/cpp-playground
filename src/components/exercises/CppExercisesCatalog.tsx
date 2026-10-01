"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Code2,
  FileCode,
  LayoutGrid,
  Lightbulb,
  List,
  Search,
  Sparkles,
  Terminal,
} from "lucide-react";
import { CPP_EXERCISES } from "@/lib/cpp-exercises";
import { getCompletedExercises } from "@/lib/exercise-progress";
import { openOrGetExerciseProject } from "@/lib/exercise-projects";
import { CppExercise } from "@/types";

type ViewMode = "grid" | "list";
type FilterMode = "all" | "pending" | "completed";

export function CppExercisesCatalog() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedView = localStorage.getItem("cpp_exercises_view_mode") as ViewMode | null;
        if (savedView === "grid" || savedView === "list") {
          return savedView;
        }
      } catch {}
    }
    return "grid";
  });
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [completed, setCompleted] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      return getCompletedExercises();
    }
    return [];
  });
  const [isNavigating, setIsNavigating] = useState<number | null>(null);

  const handleToggleView = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("cpp_exercises_view_mode", mode);
    } catch {}
  };

  const handleOpenExercise = async (exercise: CppExercise) => {
    if (isNavigating !== null) return;
    setIsNavigating(exercise.number);

    try {
      const targetId = await openOrGetExerciseProject(exercise);
      if (targetId) {
        router.push(`/cpp/playground/${targetId}`);
      }
    } catch (err) {
      console.error("Error al abrir ejercicio:", err);
      setIsNavigating(null);
    }
  };

  const filteredExercises = useMemo(() => {
    return CPP_EXERCISES.filter((ex) => {
      const isDone = completed.includes(ex.number);
      if (filterMode === "completed" && !isDone) return false;
      if (filterMode === "pending" && isDone) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        ex.number.toString().includes(q) ||
        ex.title.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q)
      );
    });
  }, [completed, filterMode, search]);

  const progressPercent = Math.round((completed.length / CPP_EXERCISES.length) * 100);

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-mono selection:bg-neon-green/30 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#07090e]/90 backdrop-blur-md px-3 sm:px-6 h-14 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/playground"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
            title="Volver a los Playgrounds"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Playgrounds</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <h1 className="font-bold text-white tracking-tight">Primeros pasos C++</h1>
          </div>
        </div>

        {/* Global Progress */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
            <span>
              {completed.length} de {CPP_EXERCISES.length} superados ({progressPercent}%)
            </span>
          </div>
          <div className="w-24 sm:w-32 h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-neon-green transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-6 flex flex-col gap-6">
        {/* Banner hero */}
        <div className="rounded-xl border border-zinc-800/90 bg-gradient-to-r from-neon-green/10 via-[#0e121a] to-[#0a0d14] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-neon-green bg-neon-green/10 border border-neon-green/30">
              <Sparkles className="w-3 h-3" />
              Ruta Guiada Paso a Paso
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Aprende C++ resolviendo problemas prácticos
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Elige cualquier ejercicio. Al abrirlo se creará automáticamente como un proyecto propio en tu
              espacio de trabajo de C++, con casos de prueba automáticos y solución de referencia.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[#06080d] border border-zinc-800 rounded-lg p-3 text-center min-w-[100px]">
              <div className="text-xl font-bold text-neon-green">{completed.length}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Superados</div>
            </div>
            <div className="bg-[#06080d] border border-zinc-800 rounded-lg p-3 text-center min-w-[100px]">
              <div className="text-xl font-bold text-zinc-300">{CPP_EXERCISES.length - completed.length}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Pendientes</div>
            </div>
          </div>
        </div>

        {/* Filters & View switcher toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a0d14] border border-zinc-800/90 rounded-xl p-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, número o enunciado..."
              className="w-full bg-[#06080d] border border-zinc-800 focus:border-neon-green/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors"
            />
          </div>

          {/* Filter Pills & View Mode */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1 bg-[#06080d] border border-zinc-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterMode === "all"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Todos ({CPP_EXERCISES.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("pending")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterMode === "pending"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Pendientes ({CPP_EXERCISES.length - completed.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("completed")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterMode === "completed"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Superados ({completed.length})
              </button>
            </div>

            <div className="flex items-center gap-1 bg-[#06080d] border border-zinc-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleToggleView("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Vista en cuadrícula"
                aria-label="Vista en cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleView("list")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Vista en lista"
                aria-label="Vista en lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Exercises list / grid */}
        {filteredExercises.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 bg-[#0a0d14] p-12 text-center text-zinc-500 text-xs">
            No se encontraron problemas que coincidan con los filtros.
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredExercises.map((exercise) => {
              const isDone = completed.includes(exercise.number);
              const isLoading = isNavigating === exercise.number;

              return (
                <div
                  key={exercise.number}
                  onClick={() => handleOpenExercise(exercise)}
                  className={`group relative rounded-xl border p-4 bg-[#0a0d14] hover:bg-[#0e121b] transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isDone
                      ? "border-neon-green/30 hover:border-neon-green/60 shadow-[0_0_15px_rgba(0,255,136,0.05)]"
                      : "border-zinc-800/90 hover:border-zinc-700"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                        Ejercicio #{exercise.number}
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neon-green bg-neon-green/10 border border-neon-green/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Superado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                          <Circle className="w-2.5 h-2.5" />
                          Pendiente
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-neon-green transition-colors line-clamp-1">
                      {exercise.title}
                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {exercise.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Terminal className="w-3 h-3" />
                        {exercise.testCases.length} casos
                      </span>
                      {exercise.hints.length > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Lightbulb className="w-3 h-3" />
                          {exercise.hints.length} pistas
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      className="px-3 py-1 rounded bg-zinc-800 group-hover:bg-neon-green group-hover:text-black text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>{isLoading ? "Abriendo..." : isDone ? "Repasar" : "Resolver"}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800/90 bg-[#0a0d14] overflow-hidden">
            <div className="divide-y divide-zinc-800/70">
              {filteredExercises.map((exercise) => {
                const isDone = completed.includes(exercise.number);
                const isLoading = isNavigating === exercise.number;

                return (
                  <div
                    key={exercise.number}
                    onClick={() => handleOpenExercise(exercise)}
                    className="p-3.5 hover:bg-[#0e121b] transition-colors cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 text-center shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-neon-green mx-auto" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-600 mx-auto" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-zinc-500 shrink-0 w-8">
                        #{exercise.number}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-white truncate hover:text-neon-green transition-colors">
                            {exercise.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate max-w-xl">
                          {exercise.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="hidden md:flex items-center gap-1 text-[11px] text-cyan-400">
                        <Terminal className="w-3 h-3" />
                        {exercise.testCases.length} casos
                      </span>

                      <button
                        type="button"
                        disabled={isLoading}
                        className="px-3 py-1 rounded bg-zinc-800 hover:bg-neon-green hover:text-black text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <span>{isLoading ? "Abriendo..." : isDone ? "Repasar" : "Resolver"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
