# J.A.R.V.I.S. Starter — private web app

Ein lauffähiger Next.js-Starter mit Schwarz-Gold-Dashboard, Three.js-Hologramm, KI-Textchat über OpenAI und bidirektionalem Speech-to-Speech-Sprachdialog über WebRTC (Realtime API).

> Noch nicht enthalten: echte Gmail-/Google-Calendar-OAuth-Verbindungen. Diese Module werden ausdrücklich als ausstehend angezeigt. Keine externen E-Mail- oder Kalenderaktionen werden simuliert.

## Voraussetzungen
- Node.js 20.9 oder neuer
- npm
- OpenAI API-Key mit API-Abrechnung
- Browser mit WebGL. Mikrofonzugriff nur über `localhost` oder HTTPS.

## Installation
```bash
npm install
cp .env.example .env.local
```
Trage in `.env.local` deinen Schlüssel ein:
```env
OPENAI_API_KEY=sk-...
```
Starte lokal:
```bash
npm run dev
```
Öffne http://localhost:3000

Produktionsbuild:
```bash
npm run build
npm start
```

## Architektur
- `src/app/page.tsx`: Einstieg
- `src/components/JarvisConsole.tsx`: Dashboard, Chat, Spracheingabe und Sprachausgabe
- `src/components/Hologram.tsx`: 3D-Hologramm (Three.js / React Three Fiber)
- `src/app/api/chat/route.ts`: serverseitiger KI-Endpunkt
- `src/app/globals.css`: Schwarz-Gold-Design

## Private Bereitstellung
Für einen privaten Server z. B. Docker/VM verwenden:
1. Node.js 20.9+ installieren.
2. Repository auf den Server kopieren.
3. `.env.local` sicher auf dem Server hinterlegen.
4. `npm ci && npm run build`.
5. Prozess mit `npm start` hinter einem Reverse Proxy (Caddy/Nginx) betreiben.
6. HTTPS aktivieren. Niemals `.env.local` committen oder `OPENAI_API_KEY` im Browser verwenden.

## Nächste Ausbauschritte
1. Realtime API: Bereits integriert. Das Backend erstellt kurzlebige Client-Secrets; der Browser verbindet sich per WebRTC. Der langlebige API-Key bleibt serverseitig.
2. Google OAuth 2.0: Gmail readonly/modify/send Scopes getrennt und minimal anfordern; Calendar scopes nach Bedarf. Token serverseitig verschlüsselt speichern.
3. Tool-Aufrufe: `draft_email`, `send_email` (mit Bestätigung), `list_calendar_events`, `create_calendar_event` (mit Bestätigung), `web_search`.
4. PostgreSQL + Prisma, Nutzerkonten, Audit-Logs und Rollen.
5. Consent- und Löschfunktionen für gespeicherte Inhalte.

## Sicherheit
- API-Key niemals mit `NEXT_PUBLIC_` präfixieren.
- OAuth State/PKCE und sichere HttpOnly-Cookies einsetzen.
- E-Mail-Versand, Terminlöschung und andere externe Aktionen immer bestätigen lassen.
- Für öffentliche Bereitstellung zusätzlich Authentifizierung, Rate-Limits, CSRF-Schutz und Monitoring aktivieren.


## Live-Sprache
Im Dashboard auf das Mikrofon klicken und die Browser-Mikrofonfreigabe erteilen. Die App erstellt serverseitig ein kurzlebiges Realtime-Client-Secret (`/api/realtime-token`) und verbindet den Browser per WebRTC mit der Realtime API. Erneutes Klicken beendet den Sprachkanal. Konfiguriert ist die Stimme `ash`; Klangfarbe und Stimmhöhe hängen von der verfügbaren Modellstimme ab.

## Docker auf privatem Server
```bash
docker compose up -d --build
```
Der Dienst bindet standardmäßig nur an `127.0.0.1:3000`. Stelle ihn für den externen Zugriff hinter einen HTTPS-Reverse-Proxy (z. B. Caddy oder Nginx) und ergänze vorher eine Anmeldung/Authentifizierung. Die App ist ohne Authentifizierung nicht für ein öffentliches Internet-Deployment geeignet.
