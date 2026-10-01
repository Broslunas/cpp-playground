"use client";

import { BookOpen, Lightbulb, Terminal, X } from "lucide-react";
import { CppExercise, ExerciseTestResult } from "@/types";

interface ExerciseDetailsPanelProps {
  exercise: CppExercise;
  results: ExerciseTestResult[];
  onClose?: () => void;
}

export function ExerciseDetailsPanel({ exercise, results, onClose }: ExerciseDetailsPanelProps) {
  const passed = results.filter((result) => result.passed).length;

  return (
    <section className="bg-[#0c0e14] border border-zinc-800 rounded-lg overflow-hidden font-mono min-h-0 flex flex-col h-full">
      <header className="p-3 border-b border-zinc-800 bg-[#090a0f] flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-neon-green mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neon-green">Ejercicio {exercise.number}</p>
            <h2 className="text-sm font-bold text-zinc-100">{exercise.title}</h2>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Cerrar panel de enunciado"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      <div className="p-3 overflow-y-auto space-y-4 text-xs">
        <p className="text-zinc-300 leading-relaxed">{exercise.description}</p>

        <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2.5">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Pistas
          </div>
          <ul className="list-disc pl-4 space-y-1 text-zinc-400 leading-relaxed">
            {exercise.hints.map((hint) => <li key={hint}>{hint}</li>)}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-1.5 text-zinc-200 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Casos de prueba
            </h3>
            {results.length > 0 && (
              <span className={`text-[10px] ${passed === exercise.testCases.length ? "text-neon-green" : "text-zinc-500"}`}>
                {passed}/{exercise.testCases.length} correctos
              </span>
            )}
          </div>
          <div className="space-y-2">
            {exercise.testCases.map((testCase, index) => (
              <details key={`${testCase.stdin}-${index}`} className="rounded border border-zinc-800 bg-black/25 group">
                <summary className="cursor-pointer select-none p-2 text-zinc-300 hover:text-white">
                  Caso {index + 1}{testCase.label ? ` · ${testCase.label}` : ""}
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-800 border-t border-zinc-800">
                  <div className="bg-[#08090d] p-2">
                    <p className="text-[10px] text-zinc-500 mb-1">Entrada (stdin)</p>
                    <pre className="whitespace-pre-wrap text-[11px] text-cyan-200">{testCase.stdin || "(sin entrada)"}</pre>
                  </div>
                  <div className="bg-[#08090d] p-2">
                    <p className="text-[10px] text-zinc-500 mb-1">Salida esperada</p>
                    <pre className="whitespace-pre-wrap text-[11px] text-neon-green">{testCase.expectedOutput}</pre>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
