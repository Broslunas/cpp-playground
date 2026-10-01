import { NextResponse } from "next/server";
import { getCurrentUser, isGithubOAuthConfigured } from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { isR2Configured } from "@/lib/r2";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json({
    user,
    configured: {
      github: isGithubOAuthConfigured(),
      mongodb: isMongoConfigured(),
      r2: isR2Configured(),
    },
  });
}
