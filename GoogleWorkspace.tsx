"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Mail, RefreshCw, ShieldCheck, ExternalLink } from "lucide-react";

type MailItem = { id: string; from: string; subject: string; date: string; snippet: string };
type EventItem = { id: string; summary: string; start?: string; end?: string; location?: string };

export default function GoogleWorkspace() {
  const [connected, setConnected] = useState(false);
  const [emails, setEmails] = useState<MailItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [draftId, setDraftId] = useState("");

  async function refresh() {
    setLoading(true); setNotice("");
    try {
      const status = await fetch("/api/google/status").then(r => r.json());
      setConnected(Boolean(status.connected));
      if (!status.connected) { setEmails([]); setEvents([]); return; }
      const [mailRes, calendarRes] = await Promise.all([fetch("/api/google/gmail"), fetch("/api/google/calendar")]);
      const mailData = await mailRes.json();
      const calendarData = await calendarRes.json();
      if (!mailRes.ok) throw new Error(mailData.error);
      if (!calendarRes.ok) throw new Error(calendarData.error);
      setEmails(mailData.messages || []); setEvents(calendarData.events || []);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Google-Daten konnten nicht geladen werden."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault(); setNotice("Speichere Entwurf…");
    const response = await fetch("/api/google/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, subject, body }) });
    const data = await response.json();
    if (!response.ok) { setNotice(data.error || "Fehler"); return; }
    setDraftId(data.draftId); setNotice("Entwurf in Gmail gespeichert – noch nicht versendet.");
  }

  async function sendDraft() {
    if (!draftId || !window.confirm("Diese E-Mail jetzt wirklich versenden?")) return;
    const response = await fetch("/api/google/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId, confirm: true }) });
    const data = await response.json();
    setNotice(response.ok ? "E-Mail wurde versendet." : (data.error || "Versand fehlgeschlagen."));
    if (response.ok) { setDraftId(""); setTo(""); setSubject(""); setBody(""); }
  }

  return <section className="google-workspace">
    <div className="google-head">
      <div><span className="eyebrow">GOOGLE WORKSPACE</span><h2>Kommunikation & Termine</h2></div>
      <button className="refresh-button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15}/> Aktualisieren</button>
    </div>
    {!connected ? <div className="google-connect">
      <ShieldCheck size={22}/>
      <div><strong>Google-Konto verbinden</strong><p>J.A.R.V.I.S. benötigt Zugriff auf Gmail und Google Kalender.</p></div>
      <a className="connect-button" href="/api/google/connect">Google verbinden <ExternalLink size={14}/></a>
    </div> : <>
      <div className="google-grid">
        <div className="google-card">
          <h3><Mail size={17}/> Letzte E-Mails</h3>
          {emails.length ? emails.map(m => <article className="google-item" key={m.id}><strong>{m.subject}</strong><small>{m.from} · {m.date}</small><p>{m.snippet}</p></article>) : <p className="muted">Keine Nachrichten gefunden.</p>}
        </div>
        <div className="google-card">
          <h3><CalendarDays size={17}/> Anstehende Termine</h3>
          {events.length ? events.map(ev => <article className="google-item" key={ev.id}><strong>{ev.summary}</strong><small>{ev.start ? new Date(ev.start).toLocaleString("de-DE") : "Ganztägig"}</small>{ev.location && <p>{ev.location}</p>}</article>) : <p className="muted">Keine kommenden Termine gefunden.</p>}
        </div>
      </div>
      <form className="draft-form" onSubmit={createDraft}>
        <h3><Mail size={17}/> E-Mail-Entwurf erstellen</h3>
        <input type="email" required placeholder="Empfänger-Adresse" value={to} onChange={e => setTo(e.target.value)}/>
        <input required placeholder="Betreff" value={subject} onChange={e => setSubject(e.target.value)}/>
        <textarea required rows={4} placeholder="Nachricht…" value={body} onChange={e => setBody(e.target.value)}/>
        <div className="draft-actions"><button className="refresh-button" type="submit">Entwurf in Gmail speichern</button>
          {draftId && <button className="send-approved" type="button" onClick={() => void sendDraft()}>Nach Prüfung versenden</button>}
        </div>
      </form>
    </>}
    {notice && <p className="google-notice">{notice}</p>}
    <p className="google-footnote">Google-Zugriff wird serverseitig verarbeitet. Versand erfordert eine separate Bestätigung. Verbundene Konten und OAuth-Berechtigungen kannst du jederzeit in deinem Google-Konto widerrufen.</p>
  </section>;
}
