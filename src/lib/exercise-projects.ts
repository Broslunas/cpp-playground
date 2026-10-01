import { CppExercise, Project } from "@/types";
import { fetchAuthStatus, fetchCloudProjects, saveProjectToCloud } from "@/lib/cloud-projects";
import { getProjectsByLanguage, saveLanguageProjects, setActiveProjectId } from "@/lib/projects";

const INITIAL_CODE = `#include <iostream>

int main() {
    // Escribe tu solución aquí
    return 0;
}
`;

export function createExerciseProject(exercise: CppExercise, isCloud = false): Project {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ex-${exercise.number}-${Date.now()}`,
    name: `Ejercicio ${exercise.number}: ${exercise.title}`,
    language: "cpp",
    code: INITIAL_CODE,
    stdin: exercise.testCases[0]?.stdin || "",
    compiler: "gcc-head",
    options: "c++20",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    exerciseNumber: exercise.number,
    isCloud,
  };
}

export async function openOrGetExerciseProject(exercise: CppExercise): Promise<string> {
  const auth = await fetchAuthStatus();
  let targetId: string = "";

  if (auth.user) {
    const cloudProjects = await fetchCloudProjects();
    const existing = cloudProjects.find(
      (p) =>
        p.exerciseNumber === exercise.number ||
        p.name === `Ejercicio ${exercise.number}: ${exercise.title}`
    );

    if (existing) {
      targetId = existing.id;
    } else {
      const newProject = createExerciseProject(exercise, true);
      const saved = await saveProjectToCloud(newProject);
      targetId = saved?.id || newProject.id;
    }
  } else {
    const localProjects = getProjectsByLanguage("cpp");
    const existing = localProjects.find(
      (p) =>
        p.exerciseNumber === exercise.number ||
        p.name === `Ejercicio ${exercise.number}: ${exercise.title}`
    );

    if (existing) {
      targetId = existing.id;
    } else {
      const newProject = createExerciseProject(exercise, false);
      saveLanguageProjects("cpp", [newProject, ...localProjects]);
      targetId = newProject.id;
    }
  }

  if (targetId) {
    setActiveProjectId(targetId, "cpp");
  }
  return targetId;
}
