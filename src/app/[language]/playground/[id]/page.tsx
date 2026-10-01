"use client";

import { use } from "react";
import { PlaygroundWorkspace } from "@/components/playground/PlaygroundWorkspace";
import { LinuxTerminalWorkspace } from "@/components/playground/LinuxTerminalWorkspace";
import { SupportedLanguage } from "@/types";

interface PageProps {
  params: Promise<{
    language: string;
    id: string;
  }>;
}

export default function LanguagePlaygroundProjectPage({ params }: PageProps) {
  const { language, id } = use(params);
  const validLang: SupportedLanguage =
    language === "c"
      ? "c"
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
      : language === "sql"
      ? "sql"
      : "cpp";

  if (validLang === "bash") {
    return <LinuxTerminalWorkspace />;
  }

  return <PlaygroundWorkspace initialLanguage={validLang} initialProjectId={id} />;
}
