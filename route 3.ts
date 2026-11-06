import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { googleAuthUrl } from "@/lib/google";

export const runtime = "nodejs";

export async function GET() {
  try {
    const state = randomBytes(24).toString("hex");
    const response = NextResponse.redirect(googleAuthUrl(state));
    response.cookies.set("jarvis_oauth_state", state, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/api/google/callback", maxAge: 600
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "OAuth-Start fehlgeschlagen" }, { status: 500 });
  }
}
