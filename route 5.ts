import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google";
export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await getGoogleClient();
    if (!auth) return NextResponse.json({ error: "Google ist noch nicht verbunden." }, { status: 401 });
    const gmail = google.gmail({ version: "v1", auth });
    const list = await gmail.users.messages.list({ userId: "me", maxResults: 10, q: "in:inbox" });
    const ids = list.data.messages || [];
    const messages = await Promise.all(ids.slice(0, 10).map(async item => {
      const result = await gmail.users.messages.get({ userId: "me", id: item.id!, format: "metadata", metadataHeaders: ["From", "Subject", "Date"] });
      const headers = result.data.payload?.headers || [];
      const header = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
      return { id: item.id, from: header("From"), subject: header("Subject") || "(Ohne Betreff)", date: header("Date"), snippet: result.data.snippet || "" };
    }));
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Postfach konnte nicht geladen werden" }, { status: 500 });
  }
}
