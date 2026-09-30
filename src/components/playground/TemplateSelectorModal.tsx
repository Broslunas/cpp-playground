"use client";

import React, { useState } from "react";
import { X, BookOpen, Sparkles, Binary, Check } from "lucide-react";
import { CODE_TEMPLATES } from "@/lib/templates";
import { CodeTemplate, SupportedLanguage } from "@/types";

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: CodeTemplate) => void;
  currentLanguage?: SupportedLanguage;
}

export function TemplateSelectorModal({
  isOpen,
  onClose,
  onSelectTemplate,
  currentLanguage,
}: TemplateSelectorModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage || "all");
  const [activePreviewId, setActivePreviewId] = useState<string>(() => {
    if (currentLanguage) {
      const match = CODE_TEMPLATES.find((t) => t.language === currentLanguage);
      if (match) return match.id;
    }
    return CODE_TEMPLATES[0].id;
  });

  if (!isOpen) return null;

  const filtered = selectedLanguage === "all"
    ? CODE_TEMPLATES
    : CODE_TEMPLATES.filter((t) => (t.language || "cpp") === selectedLanguage);

  const activeTemplate = filtered.find((t) => t.id === activePreviewId) || filtered[0] || CODE_TEMPLATES[0];

  const handleApply = (template: CodeTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      <div className="bg-[#0e111a] border border-zinc-800 rounded-lg max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-[#090a0f] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neon-green">
            <BookOpen className="w-4 h-4" />
            <h2 id="template-modal-title" className="font-semibold text-sm text-zinc-100">
              Biblioteca de Plantillas & Algoritmos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Categories / Language */}
        <div className="px-4 py-2 border-b border-zinc-800 bg-[#0c0e16] flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "Todas las plantillas" },
            { id: "cpp", label: "C++" },
            { id: "python", label: "Python 🐍" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedLanguage(tab.id);
                const nextMatch = tab.id === "all"
                  ? CODE_TEMPLATES[0]
                  : CODE_TEMPLATES.find((t) => (t.language || "cpp") === tab.id);
                if (nextMatch) setActivePreviewId(nextMatch.id);
              }}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                selectedLanguage === tab.id
                  ? "bg-zinc-800 text-neon-green font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2-column layout: List on left, preview on right */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          {/* Left list */}
          <div className="border-r border-zinc-800 overflow-y-auto p-3 space-y-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setActivePreviewId(item.id)}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  activePreviewId === item.id
                    ? "bg-zinc-800/80 border-neon-green shadow-[0_0_10px_rgba(0,255,136,0.1)]"
                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <h3 className="font-semibold text-zinc-100 flex items-center gap-1.5 truncate">
                    {item.category === "dsa" ? (
                      <Binary className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-neon-green shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                      {(item.language || "cpp").toUpperCase()}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                      {item.standard.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Right preview */}
          <div className="flex flex-col h-full bg-[#08090d] overflow-hidden">
            {activeTemplate ? (
              <>
                <div className="px-3 py-2 border-b border-zinc-800 bg-[#0a0c12] flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">
                    Previsualización: <strong className="text-zinc-200">{activeTemplate.title}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApply(activeTemplate)}
                    className="px-2.5 py-1 rounded bg-neon-green text-black font-semibold flex items-center gap-1 hover:bg-[#00e67a] transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Cargar en Editor
                  </button>
                </div>
                <pre className="flex-1 p-3 text-zinc-300 text-[11px] font-mono overflow-auto leading-relaxed whitespace-pre">
                  {activeTemplate.code}
                </pre>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                Selecciona una plantilla
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
