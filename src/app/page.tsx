import React from "react";
import { Hero } from "@/components/landing/Hero";
import { TerminalShowcase } from "@/components/landing/TerminalShowcase";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col justify-between">
      <div>
        <Hero />
        <TerminalShowcase />
        <Features />
      </div>
      <Footer />
    </main>
  );
}
