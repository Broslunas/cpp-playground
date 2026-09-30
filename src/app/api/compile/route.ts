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

    let defaultCompiler = "gcc-head";
    if (body.language === "python") defaultCompiler = "cpython-3.12.7";
    if (body.language === "javascript") defaultCompiler = "nodejs-20.17.0";
    if (body.language === "typescript") defaultCompiler = "typescript-5.6.2";

    const compiler = body.compiler || defaultCompiler;
    const isPython = body.language === "python" || compiler.startsWith("cpython") || compiler.startsWith("pypy");
    const isNodeOrTs =
      body.language === "javascript" ||
      body.language === "typescript" ||
      compiler.startsWith("nodejs") ||
      compiler.startsWith("typescript");

    const wandboxPayload: Record<string, string> = {
      code: body.code,
      compiler: compiler,
      stdin: body.stdin || "",
    };

    if (isPython || isNodeOrTs) {
      // Scripting / interpreted runtime options
      if (body.args && body.args.trim().length > 0) {
        wandboxPayload["runtime-option-raw"] = body.args.trim();
      }
    } else {
      // C++ compile options
      const stdOption = body.options ? `-std=${body.options}` : "-std=c++20";
      const rawFlags: string[] = [stdOption];

      if (body.settings?.optimization) {
        rawFlags.push(body.settings.optimization);
      } else {
        rawFlags.push("-O2");
      }

      if (body.settings?.warnings && body.settings.warnings.length > 0) {
        body.settings.warnings.forEach((w) => rawFlags.push(`-${w}`));
      } else {
        rawFlags.push("-Wall");
      }

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
