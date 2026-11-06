import "server-only";
import { google } from "googleapis";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const TOKEN_FILE = path.join(DATA_DIR, "google-tokens.enc");

function oauthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth ist nicht konfiguriert. Bitte GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET und GOOGLE_REDIRECT_URI setzen.");
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

function encryptionKey() {
  const value = process.env.TOKEN_ENCRYPTION_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error("TOKEN_ENCRYPTION_KEY muss aus genau 64 Hex-Zeichen bestehen.");
  return Buffer.from(value, "hex");
}

async function saveTokens(tokens: object) {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  await fs.writeFile(TOKEN_FILE, Buffer.concat([iv, tag, encrypted]), { mode: 0o600 });
}

async function loadTokens(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(TOKEN_FILE);
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("Google-Token konnten nicht entschlüsselt werden. Prüfe TOKEN_ENCRYPTION_KEY und .data.");
  }
}

export function googleAuthUrl(state: string) {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    state,
    scope: [
      "openid",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar.events"
    ]
  });
}

export async function storeGoogleTokens(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  await saveTokens(tokens);
}

export async function getGoogleClient() {
  const tokens = await loadTokens();
  if (!tokens) return null;
  const client = oauthClient();
  client.setCredentials(tokens);
  client.on("tokens", async updated => {
    const merged = { ...tokens, ...updated };
    await saveTokens(merged);
  });
  return client;
}

export async function googleConnectionStatus() {
  const tokens = await loadTokens();
  return { connected: Boolean(tokens), email: null as string | null };
}
