import { NextResponse } from "next/server";
import { googleConnectionStatus } from "@/lib/google";
export const runtime = "nodejs";
export async function GET() {
  try { return NextResponse.json(await googleConnectionStatus()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Status nicht verfügbar" }, { status: 500 }); }
}
