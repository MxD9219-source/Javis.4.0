import { NextRequest, NextResponse } from "next/server";
import { storeGoogleTokens } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get("jarvis_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.json({ error: "OAuth-Prüfung fehlgeschlagen. Bitte erneut verbinden." }, { status: 400 });
  }
  try {
    await storeGoogleTokens(code);
    const response = NextResponse.redirect(new URL("/?google=connected", request.url));
    response.cookies.delete("jarvis_oauth_state");
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google-Verbindung fehlgeschlagen" }, { status: 500 });
  }
}
