import { Metadata } from "next";
import { LanguageSelector } from "@/components/playground/LanguageSelector";

export const metadata: Metadata = {
  title: "Selecciona tu Entorno | Broslunas Playground",
  description:
    "Elige tu entorno de programación en Broslunas Playground: C++23 con GCC/Clang, Python 3.12, TypeScript 5.6, JavaScript V8, Linux Bash o HTML5/Canvas.",
  alternates: {
    canonical: "/playground",
  },
  openGraph: {
    title: "Selecciona tu Entorno | Broslunas Playground",
    description: "6 entornos de desarrollo aislados listos para ejecutar en tu navegador.",
  },
};

export default function PlaygroundRootPage() {
  return <LanguageSelector />;
}
