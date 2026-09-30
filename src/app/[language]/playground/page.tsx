"use client";

import { use } from "react";
import { PlaygroundWorkspace } from "@/components/playground/PlaygroundWorkspace";
import { SupportedLanguage } from "@/types";

interface PageProps {
  params: Promise<{
    language: string;
  }>;
}

export default function LanguagePlaygroundPage({ params }: PageProps) {
  const { language } = use(params);
  const validLang: SupportedLanguage =
    language === "python"
      ? "python"
      : language === "html" || language === "web"
      ? "html"
      : language === "javascript" || language === "js"
      ? "javascript"
      : "cpp";

  return <PlaygroundWorkspace initialLanguage={validLang} />;
}
