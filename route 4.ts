import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google";

export const runtime = "nodejs";

function encodeSubject(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}
function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json();
    if (typeof to !== "string" || !to.includes("@") || typeof subject !== "string" || typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Bitte Empfänger, Betreff und Nachricht korrekt angeben." }, { status: 400 });
    }
    const auth = await getGoogleClient();
    if (!auth) return NextResponse.json({ error: "Google ist noch nicht verbunden." }, { status: 401 });
    const raw = [
      `To: ${to}`,
      `Subject: ${encodeSubject(subject)}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding:  base64",
      "",
      Buffer.from(body, "utf8").toString("base64")
    ].join("\r\n");
    const gmail = google.gmail({ version: "v1", auth });
    const result = await gmail.users.drafts.create({ userId: "me", requestBody: { message: { raw: toBase64Url(raw) } } });
    return NextResponse.json({ draftId: result.data.id, message: "Entwurf in Gmail gespeichert. Noch nicht versendet." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Entwurf konnte nicht gespeichert werden" }, { status: 500 });
  }
}
