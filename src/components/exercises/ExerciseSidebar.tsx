"use client";

import { CheckCircle2, Circle, Code2, ListChecks } from "lucide-react";
import { CppExercise } from "@/types";

interface ExerciseSidebarProps {
  exercises: CppExercise[];
  selectedNumber: number;
  completed: number[];
  onSelect: (number: number) => void;
}

export function ExerciseSidebar({
  exercises,
  selectedNumber,
  completed,
  onSelect,
}: ExerciseSidebarProps) {
  return (
    <aside className="w-full lg:w-72 shrink-0 bg-[#0c0e14] border border-zinc-800 rounded-lg overflow-hidden flex flex-col min-h-0 font-mono">
      <div className="p-3 border-b border-zinc-800 bg-[#090a0f]">
        <div className="flex items-center gap-2 text-neon-green">
          <Code2 className="w-4 h-4" />
          <h1 className="text-sm font-bold text-zinc-100">Primeros pasos C++</h1>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-400">
          <ListChecks className="w-3.5 h-3.5 text-cyan-400" />
          <span>{completed.length}/{exercises.length} superados</span>
          <div className="h-1.5 flex-1 rounded bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-neon-green transition-all"
              style={{ width: `${(completed.length / exercises.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <nav className="overflow-y-auto p-2 space-y-1" aria-label="Ejercicios de C++">
        {exercises.map((exercise) => {
          const isSelected = exercise.number === selectedNumber;
          const isCompleted = completed.includes(exercise.number);
          return (
            <button
              key={exercise.number}
              type="button"
              onClick={() => onSelect(exercise.number)}
              aria-current={isSelected ? "page" : undefined}
              className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors ${
                isSelected
                  ? "bg-neon-green/10 border border-neon-green/40 text-white"
                  : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" aria-label="Superado" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-600 shrink-0" aria-hidden="true" />
              )}
              <span className={`w-5 text-[10px] shrink-0 ${isSelected ? "text-neon-green" : "text-zinc-500"}`}>
                {exercise.number}.
              </span>
              <span className="text-xs truncate">{exercise.title}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
