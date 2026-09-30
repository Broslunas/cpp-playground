import { LanguageSelector } from "@/components/playground/LanguageSelector";

export const metadata = {
  title: "Selecciona tu Entorno | C++ & Python Playground",
  description:
    "Elige tu entorno de programación: C++ con compilación nativa o Python con ejecución rápida.",
};

export default function PlaygroundRootPage() {
  return <LanguageSelector />;
}

