import { Metadata } from "next";
import { CppExercisesCatalog } from "@/components/exercises/CppExercisesCatalog";

export const metadata: Metadata = {
  title: "Primeros Pasos C++ | Catálogo de Problemas",
  description: "Aprende C++ resolviendo ejercicios progresivos. Explora todos los problemas en lista o cuadrícula y ábrelos como proyectos en el playground.",
};

export default function PrimerosPasosCppPage() {
  return <CppExercisesCatalog />;
}
