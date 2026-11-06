import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY ist nicht konfiguriert." }, { status: 500 });
  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime",
          audio: { output: { voice: process.env.OPENAI_REALTIME_VOICE || "ash" } }
        }
      })
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error?.message || "Realtime-Token konnte nicht erstellt werden." }, { status: response.status });
    return NextResponse.json({ value: data.value || data.client_secret?.value });
  } catch {
    return NextResponse.json({ error: "Realtime-Dienst nicht erreichbar." }, { status: 502 });
  }
}
