const STORAGE_KEY = "cpp-exercises-completed";

export function getCompletedExercises(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? [...new Set(saved.filter((value): value is number => Number.isInteger(value) && value > 0))]
      : [];
  } catch {
    return [];
  }
}

export function completeExercise(number: number): number[] {
  const completed = [...new Set([...getCompletedExercises(), number])].sort((a, b) => a - b);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  } catch {}

  return completed;
}
