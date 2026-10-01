import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { CompileRequest, CompileResponse } from "@/types";

const WANDBOX_API = "https://wandbox.org/api/compile.json";
const MAX_CODE_LENGTH = 50 * 1024; // 50KB

export async function POST(req: NextRequest) {
  // Rate limiting by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const rateCheck = rateLimit(ip);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait before compiling again.",
        stdout: "",
        stderr: `Rate limit exceeded. Try again in ${rateCheck.resetInSeconds} seconds.`,
        compilerOutput: "",
        exitCode: 429,
      } as CompileResponse,
      {
        status: 429,
        headers: {
          "Retry-After": rateCheck.resetInSeconds.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const body: CompileRequest = await req.json();

    if (!body.code || typeof body.code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    if (body.code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { error: "Code exceeds maximum allowed size (50KB)" },
        { status: 400 }
      );
    }

    if (body.language === "html") {
      return NextResponse.json({
        stdout: "Código HTML/CSS/JS ejecutado en el visor en vivo del navegador.",
        stderr: "",
        compilerOutput: "Renderizado DOM completado con éxito.",
        exitCode: 0,
        executionTimeMs: 0,
        time: new Date().toLocaleTimeString(),
      } as CompileResponse);
    }

    let defaultCompiler = "clang-head";
    if (body.language === "c") defaultCompiler = "clang-head-c";
    if (body.language === "python") defaultCompiler = "cpython-3.12.7";
    if (body.language === "javascript") defaultCompiler = "nodejs-20.17.0";
    if (body.language === "typescript") defaultCompiler = "typescript-5.6.2";
    if (body.language === "bash") defaultCompiler = "bash";
    if (body.language === "sql") defaultCompiler = "sqlite-3.45";

    const compiler = body.compiler || defaultCompiler;
    const isPython = body.language === "python" || compiler.startsWith("cpython") || compiler.startsWith("pypy");
    const isBash = body.language === "bash" || compiler === "bash";
    const isSql = body.language === "sql" || compiler.startsWith("sqlite");
    const isC = body.language === "c" || compiler.endsWith("-c");
    const isNodeOrTs =
      body.language === "javascript" ||
      body.language === "typescript" ||
      compiler.startsWith("nodejs") ||
      compiler.startsWith("typescript");

    let codeToCompile = body.code;
    if (body.inputMode === "interactive") {
      if (body.language === "cpp" || (!isPython && !isBash && !isSql && !isC && !isNodeOrTs)) {
        codeToCompile = `#if defined(__cplusplus)
#include <iostream>
#include <cstdio>
#include <cstdlib>
#include <exception>
namespace __interactive_helper {
  static void __on_term() {
    std::cerr << std::endl << "__INTERACTIVE_WAITING_INPUT__" << std::endl;
    std::exit(0);
  }
  struct __Init {
    __Init() {
      std::set_terminate(__on_term);
      std::cin.exceptions(std::ios_base::eofbit);
    }
  } __init;
}
static inline int __interactive_check_scanf(int r) {
  if (r == EOF) {
    fprintf(stderr, "\n__INTERACTIVE_WAITING_INPUT__\n");
    exit(0);
  }
  return r;
}
#define scanf(...) (fflush(stdout), __interactive_check_scanf(scanf(__VA_ARGS__)))
#endif
#line 1 "main.cpp"
` + body.code;
      } else if (body.language === "c" || isC) {
        codeToCompile = `#ifndef __cplusplus
#include <stdio.h>
#include <stdlib.h>
static inline int __interactive_check_scanf(int r) {
  if (r == EOF) {
    fprintf(stderr, "\n__INTERACTIVE_WAITING_INPUT__\n");
    exit(0);
  }
  return r;
}
static inline int __interactive_check_getchar(int c) {
  if (c == EOF) {
    fprintf(stderr, "\n__INTERACTIVE_WAITING_INPUT__\n");
    exit(0);
  }
  return c;
}
#define scanf(...) (fflush(stdout), __interactive_check_scanf(scanf(__VA_ARGS__)))
#define getchar() (fflush(stdout), __interactive_check_getchar(getchar()))
#endif
#line 1 "main.c"
` + body.code;
      }
    }

    const wandboxPayload: Record<string, string> = {
      code: codeToCompile,
      compiler: compiler,
      stdin: body.stdin || "",
    };

    if (isPython || isNodeOrTs || isBash || isSql) {
      // Scripting / interpreted / managed runtime options
      if (body.args && body.args.trim().length > 0) {
        wandboxPayload["runtime-option-raw"] = body.args.trim();
      }
    } else {
      // C / C++ compile options
      const defaultStd = isC ? "-std=c17" : "-std=c++20";
      const stdOption = body.options ? `-std=${body.options}` : defaultStd;
      const rawFlags: string[] = [stdOption];

      if (body.settings?.optimization) {
        rawFlags.push(body.settings.optimization);
      } else {
        rawFlags.push("-O1");
      }

      if (body.settings?.warnings && body.settings.warnings.length > 0) {
        body.settings.warnings.forEach((w) => rawFlags.push(`-${w}`));
      } else {
        rawFlags.push("-Wall");
      }

      // ponytail: sanitizers significantly slow compilation; only add if explicitly requested
      if (body.settings?.sanitizers && body.settings.sanitizers.length > 0) {
        body.settings.sanitizers.forEach((s) => rawFlags.push(`-fsanitize=${s}`));
      }

      if (body.settings?.customFlags) {
        const customs = body.settings.customFlags
          .split(/\s+/)
          .map((f) => f.trim())
          .filter((f) => f.length > 0 && f.startsWith("-"));
        rawFlags.push(...customs);
      }

      wandboxPayload["options"] = "warning";
      wandboxPayload["compiler-option-raw"] = rawFlags.join("\n");

      if (body.args && body.args.trim().length > 0) {
        wandboxPayload["runtime-option-raw"] = body.args.trim();
      }
    }

    const startTime = Date.now();

    const response = await fetch(WANDBOX_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wandboxPayload),
      // 25 second timeout for compilation
      signal: AbortSignal.timeout(25000),
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        {
          stdout: "",
          stderr: `Wandbox compilation error: ${response.statusText}`,
          compilerOutput: errText,
          exitCode: 1,
        } as CompileResponse,
        { status: 502 }
      );
    }

    const data = await response.json();

    const result: CompileResponse = {
      stdout: data.program_output || "",
      stderr: data.program_error || "",
      compilerOutput: data.compiler_message || data.compiler_error || "",
      exitCode: data.status !== undefined ? Number(data.status) : 0,
      time: data.created_at ? new Date(data.created_at * 1000).toLocaleTimeString() : undefined,
      executionTimeMs,
    };

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Remaining": rateCheck.remaining.toString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === "TimeoutError") {
      return NextResponse.json(
        {
          stdout: "",
          stderr: "Compilation timed out after 25 seconds.",
          compilerOutput: "",
          exitCode: 124,
        } as CompileResponse,
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        stdout: "",
        stderr: err.message || "Internal server error during compilation.",
        compilerOutput: "",
        exitCode: 500,
      } as CompileResponse,
      { status: 500 }
    );
  }
}
