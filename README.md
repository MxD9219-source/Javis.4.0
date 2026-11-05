# J.A.R.V.I.S. – Personal AI Assistant

Private, deutschsprachige Weboberfläche mit KI-Chat, Hologramm-Avatar, Sprachdialog sowie Google-Gmail- und Google-Kalender-Anbindung.

## Funktionen

- Schwarze/goldene Dashboard-Oberfläche und animierter Three.js-Hologramm-Avatar
- KI-Chat über die OpenAI API
- Live-Sprachdialog über OpenAI Realtime (WebRTC); Browser-Sprachausgabe als Fallback
- Google OAuth 2.0-Verbindung
- Gmail: letzte Inbox-Nachrichten lesen, E-Mail-Entwürfe speichern und nach zusätzlicher Bestätigung versenden
- Google Kalender: kommende Termine lesen
- Serverseitig verschlüsselte Speicherung der Google OAuth-Tokens (AES-256-GCM)
- Einfacher Passwortschutz für eine private Einzelbenutzer-Instanz
- Docker-Konfiguration

## Voraussetzungen

- Node.js 20.9 oder neuer
- OpenAI API-Key und ein für dein Konto freigeschaltetes Realtime-Modell
- Google Cloud-Projekt mit aktivierter Gmail API und Google Calendar API
- OAuth 2.0 Client vom Typ **Webanwendung**

## Lokal starten

1. Repository klonen und Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. Umgebungsdatei anlegen:

   ```bash
   cp .env.example .env.local
   ```

3. In `.env.local` mindestens setzen:

   - `OPENAI_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback`
   - `TOKEN_ENCRYPTION_KEY` (64 Hex-Zeichen; generieren mit `openssl rand -hex 32`)
   - `APP_PASSWORD` (langes, zufälliges Passwort)

4. Google Cloud Console konfigurieren:

   - APIs & Dienste → Bibliothek: **Gmail API** und **Google Calendar API** aktivieren.
   - OAuth-Zustimmungsbildschirm einrichten. Für private Tests den eigenen Google-Account als Testnutzer hinzufügen.
   - Anmeldedaten → OAuth-Client-ID → **Webanwendung** erstellen.
   - Autorisierte Weiterleitungs-URI exakt auf `http://localhost:3000/api/google/callback` setzen.
   - Client-ID und Client-Secret in `.env.local` eintragen.

5. Starten:

   ```bash
   npm run dev
   ```

6. Browser öffnen: http://localhost:3000. Der Passwortdialog nutzt `APP_PASSWORD` (Benutzername kann beliebig sein). Danach im Google-Workspace-Bereich auf **Google verbinden** klicken.

## Google-Berechtigungen

Die App fragt folgende Scopes an:
- `openid`, `email`
- `gmail.readonly` – Inbox lesen
- `gmail.compose` – Entwürfe erstellen
- `gmail.send` – Versand nach ausdrücklicher Bestätigung
- `calendar.events` – Kalendertermine lesen und erstellen

Die App erstellt Termine derzeit über die Kalender-API-Route; die UI für die Termin-Erstellung ist ein nächster UI-Ausbau. Sende- und Erstell-Endpunkte verlangen `confirm: true`.

## Deployment

Für einen privaten Server:

1. Domain und HTTPS einrichten.
2. Umgebungsvariablen sicher beim Host hinterlegen, nicht im Git-Repository.
3. `GOOGLE_REDIRECT_URI` auf `https://DEINE-DOMAIN/api/google/callback` ändern und dieselbe URI in Google Cloud eintragen.
4. `APP_URL` auf die öffentliche HTTPS-Adresse setzen.
5. Persistentes, nur für den App-Prozess lesbares Volume für `.data/` einrichten. Ohne dieses Verzeichnis gehen lokal gespeicherte Google-Tokens bei einem Container-Neustart oder Redeploy verloren.
6. `TOKEN_ENCRYPTION_KEY` sicher sichern. Wenn dieser Schlüssel verloren geht, sind die gespeicherten Tokens nicht mehr lesbar.
7. `APP_PASSWORD` mit einem starken individuellen Wert setzen.

Docker:

```bash
docker compose up --build -d
```

## GitHub

```bash
git init
git add .
git commit -m "Initial JARVIS assistant"
git branch -M main
git remote add origin https://github.com/DEIN-ACCOUNT/jarvis-assistant.git
git push -u origin main
```

Vor dem Push prüfen: `.env.local`, `.data/` und Zugangsdaten dürfen niemals eingecheckt werden.

## Sicherheitsgrenzen / Produktionshinweise

- Die App ist als private Einzelbenutzer-Basis gedacht, nicht als Multi-Tenant-Dienst.
- Für öffentlich erreichbare Deployments sollte der Basic-Auth-Gate durch eine vollständige Authentifizierung mit sicherer Session, CSRF-Schutz und Rate-Limits ersetzt werden.
- Google OAuth-Scopes für Gmail-Versand sind sensibel. Google kann bei externen Anwendungen eine Verifizierung verlangen. Für private Tests nutze den eigenen Testnutzer.
- OAuth-Tokens liegen verschlüsselt in `.data/google-tokens.enc`. Der Verschlüsselungsschlüssel muss außerhalb des Repositories bleiben.
- Der Chat-Endpunkt besitzt derzeit keine Tools zum eigenständigen Aufrufen der Gmail- und Kalender-APIs. Die Workspace-Funktionen werden über die separaten API-Routen ausgeführt.
- Der Browser-Sprachdialog benötigt Mikrofonfreigabe und HTTPS (localhost ist für Entwicklung erlaubt).
- Die Hologramm-Figur ist eine stilisierte 3D-Darstellung, kein fotorealistischer Mensch.
- Vor produktivem Einsatz: `npm install`, `npm run build`, OAuth-Flow und alle API-Routen in deiner Zielumgebung testen.

## Lizenz

MIT – siehe `LICENSE`.
