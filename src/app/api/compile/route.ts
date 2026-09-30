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

    const compiler = body.compiler || "gcc-head";
    const stdOption = body.options ? `-std=${body.options}` : "-std=c++20";

    // Call Wandbox API
    const response = await fetch(WANDBOX_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: body.code,
        compiler: compiler,
        stdin: body.stdin || "",
        options: "warning",
        "compiler-option-raw": `${stdOption}\n-O2\n-Wall`,
      }),
      // 25 second timeout for compilation
      signal: AbortSignal.timeout(25000),
    });

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
