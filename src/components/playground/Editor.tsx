"use client";

import React, { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  StreamLanguage,
} from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  language?: string;
  readOnly?: boolean;
}

export function Editor({
  value,
  onChange,
  onRun,
  language = "cpp",
  readOnly = false,
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageConfRef = useRef(new Compartment());

  // Keep callback refs updated without re-triggering effect
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);

  useEffect(() => {
    onChangeRef.current = onChange;
    onRunRef.current = onRun;
  });

  const getLanguageExtension = (lang: string) => {
    switch (lang) {
      case "python":
        return python();
      case "html":
        return html();
      case "javascript":
        return javascript();
      case "typescript":
        return javascript({ typescript: true });
      case "bash":
        return StreamLanguage.define(shell);
      case "csharp":
        return StreamLanguage.define(csharp);
      case "c":
      case "cpp":
      default:
        return cpp();
    }
  };

  useEffect(() => {
    if (!editorRef.current) return;

    // Custom keymap to trigger compile on Ctrl+Enter / Cmd+Enter
    const runKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          if (onRunRef.current) {
            onRunRef.current();
            return true;
          }
          return false;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        runKeymap,
        languageConfRef.current.of(getLanguageExtension(language)),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorState.readOnly.of(readOnly),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []); // Run once on mount

  // Update language when prop changes
  useEffect(() => {
    const view = viewRef.current;
    if (view) {
      view.dispatch({
        effects: languageConfRef.current.reconfigure(getLanguageExtension(language)),
      });
    }
  }, [language]);

  // Update doc if external value changes (e.g. project switch)
  useEffect(() => {
    const view = viewRef.current;
    if (view) {
      const currentDoc = view.state.doc.toString();
      if (value !== currentDoc) {
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: value },
        });
      }
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="w-full h-full min-h-0 border border-zinc-800 rounded bg-[#0b0d13] overflow-hidden focus-within:border-zinc-700"
      aria-label="Code Editor"
      role="region"
    />
  );
}
