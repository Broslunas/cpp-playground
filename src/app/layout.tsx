import type { Metadata } from "next";
import "./globals.css";
import { SkipLink } from "@/components/ui/SkipLink";

export const metadata: Metadata = {
  title: "C++ Playground | Online Modern C++ Compiler & Runner",
  description:
    "Playground moderno e interactivo para compilar y ejecutar código C++ en tiempo real con soporte para stdin, compiladores recientes (GCC, Clang) y persistencia local.",
  keywords: ["c++", "cpp", "compiler", "playground", "online compiler", "gcc", "clang"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#090a0f] text-zinc-200 antialiased selection:bg-neon-green/20 selection:text-neon-green font-sans">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
