"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Play, Sparkles } from "lucide-react";
import { Editor } from "@/components/playground/Editor";
import { StdinPanel } from "@/components/playground/StdinPanel";
import { OutputPanel } from "@/components/playground/OutputPanel";
import { ExerciseSidebar } from "@/components/exercises/ExerciseSidebar";
import { ExerciseDetailsPanel } from "@/components/exercises/ExerciseDetailsPanel";
import { CPP_EXERCISES } from "@/lib/cpp-exercises";
import { completeExercise, getCompletedExercises } from "@/lib/exercise-progress";
import { CompileResponse, ExerciseTestResult } from "@/types";

const INITIAL_CODE = `#include <iostream>

int main() {
    // Escribe tu solución aquí
    return 0;
}
`;

function normalize(str: string): string {
  return str.replace(/\r\n/g, "\n").trimEnd() + "\n";
}

export function CppExercisesWorkspace() {
  const [selectedNumber, setSelectedNumber] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [code, setCode] = useState(INITIAL_CODE);
  const [stdin, setStdin] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [manualOutput, setManualOutput] = useState<CompileResponse | null>(null);
  const [testResults, setTestResults] = useState<ExerciseTestResult[]>([]);
  const [showToast, setShowToast] = useState(false);

  const activeExercise = CPP_EXERCISES.find((ex) => ex.number === selectedNumber) || CPP_EXERCISES[0];

  useEffect(() => {
    setCompleted(getCompletedExercises());
  }, []);

  useEffect(() => {
    setCode(INITIAL_CODE);
    setStdin(activeExercise.testCases[0]?.stdin || "");
    setManualOutput(null);
    setTestResults([]);
  }, [selectedNumber, activeExercise]);

  const handleRunManual = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setManualOutput(null);

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "cpp",
          code,
          stdin,
          compiler: "gcc-head",
          options: "c++20",
        }),
      });

      const data: CompileResponse = await response.json();
      setManualOutput(data);
    } catch (err: unknown) {
      const error = err as Error;
      setManualOutput({
        stdout: "",
        stderr: error.message || "Error al conectar con el compilador.",
        compilerOutput: "",
        exitCode: 1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunTests = async () => {
    if (isTesting) return;
    setIsTesting(true);
    const results: ExerciseTestResult[] = [];
    let allPassed = true;

    for (const testCase of activeExercise.testCases) {
      try {
        const response = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: "cpp",
            code,
            stdin: testCase.stdin,
            compiler: "gcc-head",
            options: "c++20",
          }),
        });

        const data: CompileResponse = await response.json();
        const actual = data.stdout || "";
        const passed = data.exitCode === 0 && normalize(actual) === normalize(testCase.expectedOutput);

        results.push({
          testCase,
          actualOutput: actual,
          passed,
          error: data.stderr || (data.exitCode !== 0 ? data.compilerOutput : undefined),
        });

        if (!passed) allPassed = false;
        if (data.exitCode !== 0) break;
      } catch (err: unknown) {
        const error = err as Error;
        results.push({
          testCase,
          actualOutput: "",
          passed: false,
          error: error.message || "Error en la petición de compilación.",
        });
        allPassed = false;
        break;
      }
    }

    setTestResults(results);

    if (allPassed && results.length === activeExercise.testCases.length) {
      setCompleted(completeExercise(activeExercise.number));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }

    setIsTesting(false);
  };

  const handleLoadSolution = useCallback(() => {
    if (
      code.trim() &&
      code !== INITIAL_CODE &&
      !window.confirm("¿Sustituir el código actual por la solución de referencia?")
    ) {
      return;
    }
    setCode(activeExercise.solution);
  }, [code, activeExercise]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#090a0f] font-mono text-xs">
      <header className="h-14 border-b border-zinc-800 bg-[#090a0f] px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/playground"
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center gap-1.5"
            title="Volver al Playground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Playgrounds</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="font-semibold text-white">Primeros pasos C++</span>
          <span className="text-zinc-500">· Ejercicio {activeExercise.number} de {CPP_EXERCISES.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunManual}
            disabled={isRunning || isTesting}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar (manual)</span>
          </button>

          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunning || isTesting}
            className="px-3.5 py-1.5 rounded bg-neon-green text-black font-bold flex items-center gap-1.5 hover:bg-[#00e67a] transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isTesting ? "Comprobando..." : "Comprobar ejercicio"}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 gap-2 min-h-0">
        <ExerciseSidebar
          exercises={CPP_EXERCISES}
          selectedNumber={selectedNumber}
          completed={completed}
          onSelect={setSelectedNumber}
        />

        <div className="w-full lg:w-80 flex flex-col min-h-0 shrink-0">
          <ExerciseDetailsPanel exercise={activeExercise} results={testResults} />
        </div>

        <main className="flex-1 flex flex-col min-h-0 min-w-0 gap-2">
          <div className="flex-1 min-h-[300px] border border-zinc-800 rounded-lg overflow-hidden">
            <Editor
              value={code}
              onChange={setCode}
              onRun={handleRunManual}
              language="cpp"
              readOnly={isRunning || isTesting}
            />
          </div>

          <div className="h-64 flex flex-col sm:flex-row gap-2 min-h-0">
            <div className="w-full sm:w-1/3 min-h-0">
              <StdinPanel value={stdin} onChange={setStdin} disabled={isRunning || isTesting} />
            </div>
            <div className="w-full sm:w-2/3 min-h-0">
              <OutputPanel
                result={manualOutput}
                isRunning={isRunning || isTesting}
                onClear={() => setManualOutput(null)}
                language="cpp"
                testResults={testResults}
                solution={activeExercise.solution}
                onLoadSolution={handleLoadSolution}
              />
            </div>
          </div>
        </main>
      </div>

      {showToast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 bg-neon-green text-black px-4 py-2.5 rounded shadow-2xl text-xs font-mono font-bold flex items-center gap-2 z-50 animate-bounce"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>¡Ejercicio {activeExercise.number} superado con éxito!</span>
        </div>
      )}
    </div>
  );
}
