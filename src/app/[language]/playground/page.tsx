"use client";

import { use } from "react";
import { PlaygroundWorkspace } from "@/components/playground/PlaygroundWorkspace";
import { LinuxTerminalWorkspace } from "@/components/playground/LinuxTerminalWorkspace";
import { SupportedLanguage } from "@/types";

interface PageProps {
  params: Promise<{
    language: string;
  }>;
}

export default function LanguagePlaygroundPage({ params }: PageProps) {
  const { language } = use(params);
  const validLang: SupportedLanguage =
    language === "c"
      ? "c"
      : language === "csharp" || language === "cs"
      ? "csharp"
      : language === "python"
      ? "python"
      : language === "html" || language === "web"
      ? "html"
      : language === "javascript" || language === "js"
      ? "javascript"
      : language === "typescript" || language === "ts"
      ? "typescript"
      : language === "bash" || language === "sh" || language === "linux" || language === "terminal"
      ? "bash"
      : "cpp";

  if (validLang === "bash") {
    return <LinuxTerminalWorkspace />;
  }

  return <PlaygroundWorkspace initialLanguage={validLang} />;
}
