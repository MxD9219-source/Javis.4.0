import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { draftId, confirm } = await request.json();
    if (confirm !== true) return NextResponse.json({ error: "Versand benötigt eine ausdrückliche Bestätigung." }, { status: 400 });
    if (typeof draftId !== "string" || !draftId) return NextResponse.json({ error: "draftId fehlt." }, { status: 400 });
    const auth = await getGoogleClient();
    if (!auth) return NextResponse.json({ error: "Google ist noch nicht verbunden." }, { status: 401 });
    const gmail = google.gmail({ version: "v1", auth });
    const result = await gmail.users.drafts.send({ userId: "me", requestBody: { id: draftId } });
    return NextResponse.json({ sent: true, messageId: result.data.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "E-Mail konnte nicht versendet werden" }, { status: 500 });
  }
}
