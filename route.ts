import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google";
export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await getGoogleClient();
    if (!auth) return NextResponse.json({ error: "Google ist noch nicht verbunden." }, { status: 401 });
    const calendar = google.calendar({ version: "v3", auth });
    const result = await calendar.events.list({ calendarId: "primary", timeMin: new Date().toISOString(), maxResults: 10, singleEvents: true, orderBy: "startTime" });
    return NextResponse.json({ events: (result.data.items || []).map(e => ({ id: e.id, summary: e.summary || "(Ohne Titel)", start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date, location: e.location || "" })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kalender konnte nicht geladen werden" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { summary, start, end, description, confirm } = await request.json();
    if (confirm !== true) return NextResponse.json({ error: "Terminerstellung benötigt eine ausdrückliche Bestätigung." }, { status: 400 });
    if (typeof summary !== "string" || !summary.trim() || typeof start !== "string" || typeof end !== "string" || new Date(start) >= new Date(end)) {
      return NextResponse.json({ error: "Bitte Titel sowie gültige Start- und Endzeit angeben." }, { status: 400 });
    }
    const auth = await getGoogleClient();
    if (!auth) return NextResponse.json({ error: "Google ist noch nicht verbunden." }, { status: 401 });
    const calendar = google.calendar({ version: "v3", auth });
    const event = await calendar.events.insert({ calendarId: "primary", requestBody: { summary, start: { dateTime: start }, end: { dateTime: end }, description: typeof description === "string" ? description : "" } });
    return NextResponse.json({ created: true, id: event.data.id, htmlLink: event.data.htmlLink });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Termin konnte nicht erstellt werden" }, { status: 500 });
  }
}
