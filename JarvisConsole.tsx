 "use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Activity, CalendarDays, Command, Globe2, Mail, Mic, MicOff, Send, ShieldCheck, Volume2, VolumeX, Zap } from "lucide-react";\nimport GoogleWorkspace from "@/components/GoogleWorkspace";

const Hologram = dynamic(() => import("@/components/Hologram"), { ssr: false });

type Message = { role: "user" | "assistant"; content: string };
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: any) => void) | null; onend: (() => void) | null;
  onerror: (() => void) | null; start: () => void; stop: () => void;
};
declare global { interface Window { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike } }

export default function JarvisConsole() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Guten Tag. J.A.R.V.I.S. ist online. Wie kann ich Sie unterstützen?" }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [status, setStatus] = useState("SYSTEM BEREIT");
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  function speak(text: string) {
    if (!voiceEnabled || liveConnected || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.91;
    utterance.pitch = 0.72;
    const voices = window.speechSynthesis.getVoices();
    const german = voices.find(v => v.lang.toLowerCase().startsWith("de") && /male|markus|hans|stefan/i.test(v.name))
      || voices.find(v => v.lang.toLowerCase().startsWith("de"));
    if (german) utterance.voice = german;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...messages, { role: "user" as const, content: clean }];
    setMessages(next); setInput(""); setBusy(true); setStatus("ANALYSIERE ANFRAGE");
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Anfrage fehlgeschlagen");
      const answer = String(data.answer || "Ich konnte keine Antwort erzeugen.");
      setMessages(prev => [...prev, { role: "assistant", content: answer }]);
      speak(answer); setStatus("SYSTEM BEREIT");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setMessages(prev => [...prev, { role: "assistant", content: `Systemhinweis: ${message}` }]);
      setStatus("VERBINDUNG PRÜFEN");
    } finally { setBusy(false); }
  }

  async function startLiveVoice() {
    try {
      setStatus("VERBINDE SPRACHKANAL");
      const tokenResponse = await fetch("/api/realtime-token", { method: "POST" });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenData.error || "Realtime-Token fehlgeschlagen");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      const pc = new RTCPeerConnection();
      peer.current = pc;
      const audio = document.createElement("audio");
      audio.autoplay = true;
      remoteAudio.current = audio;
      pc.ontrack = event => {
        audio.srcObject = event.streams[0];
        void audio.play().catch(() => undefined);
      };
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      const channel = pc.createDataChannel("oai-events");
      channel.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "response.output_audio_transcript.done" && payload.transcript)
            setMessages(prev => [...prev, { role: "assistant", content: payload.transcript }]);
          if (payload.type === "conversation.item.input_audio_transcription.completed" && payload.transcript)
            setMessages(prev => [...prev, { role: "user", content: payload.transcript }]);
          if (payload.type === "error") setStatus("SPRACHKANAL: " + (payload.error?.message || "Fehler"));
        } catch { /* Ignore unknown events. */ }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenData.value}`, "Content-Type": "application/sdp" },
        body: offer.sdp
      });
      if (!sdpResponse.ok) throw new Error("WebRTC-Verbindung konnte nicht aufgebaut werden.");
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });
      setLiveConnected(true);
      setListening(true);
      setStatus("LIVE-SPRACHKANAL AKTIV");
      setMessages(prev => [...prev, { role: "assistant", content: "Live-Sprachverbindung hergestellt. Ich höre zu." }]);
    } catch (error) {
      stopLiveVoice();
      const message = error instanceof Error ? error.message : "Sprachverbindung fehlgeschlagen";
      setStatus("SPRACHVERBINDUNG FEHLGESCHLAGEN");
      setMessages(prev => [...prev, { role: "assistant", content: `Sprachsystem: ${message}` }]);
    }
  }

  function stopLiveVoice() {
    peer.current?.close();
    peer.current = null;
    localStream.current?.getTracks().forEach(track => track.stop());
    localStream.current = null;
    if (remoteAudio.current) remoteAudio.current.srcObject = null;
    setLiveConnected(false);
    setListening(false);
    setStatus("SYSTEM BEREIT");
  }

  function toggleListening() {
    if (liveConnected) stopLiveVoice();
    else void startLiveVoice();
  }

  function submit(event: FormEvent) { event.preventDefault(); void sendMessage(input); }

  useEffect(() => () => {
    peer.current?.close();
    localStream.current?.getTracks().forEach(track => track.stop());
    window.speechSynthesis?.cancel();
  }, []);

  return <div className="dashboard">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">J</div><div><strong>J.A.R.V.I.S.</strong><small>PERSONAL INTELLIGENCE SYSTEM</small></div></div>
      <div className="top-status"><span className="pulse" /> {status}</div>
      <div className="top-right"><span className="private"><ShieldCheck size={14}/> PRIVATE INSTANCE</span><span className="clock">v0.1</span></div>
    </header>

    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><Zap size={13}/> PERSONAL AI INTERFACE</div>
        <h1>Guten Tag.</h1>
        <p>Ihr persönliches Kontrollzentrum ist bereit.</p>
        <div className="hero-metrics">
          <div><span className="metric-dot" /> <b>KI-KERN</b><small>Verbunden über API</small></div>
          <div><span className="metric-dot muted" /> <b>GMAIL</b><small>Noch nicht verbunden</small></div>
          <div><span className="metric-dot muted" /> <b>KALENDER</b><small>Noch nicht verbunden</small></div>
        </div>
      </div>
      <div className="holo-wrap"><Hologram active={listening || speaking || busy}/></div>
    </section>

    <section className="workspace">
      <aside className="side">
        <div className="section-label">MODULE</div>
        <div className="nav-item selected"><Command size={17}/> Assistent <span>●</span></div>
        <div className="nav-item"><Mail size={17}/> E-Mail <em>OAuth ausstehend</em></div>
        <div className="nav-item"><CalendarDays size={17}/> Kalender <em>OAuth ausstehend</em></div>
        <div className="nav-item"><Globe2 size={17}/> Recherche <em>API ausstehend</em></div>
        <div className="nav-item"><Activity size={17}/> Analytics <em>In Vorbereitung</em></div>
        <div className="side-note"><ShieldCheck size={16}/><span>Ihre API-Schlüssel bleiben serverseitig.</span></div>
      </aside>

      <section className="chat-panel">
        <div className="panel-head"><div><span className="eyebrow">LIVE SESSION</span><h2>Mit J.A.R.V.I.S. sprechen</h2></div><span className="online"><i/> {liveConnected ? "LIVE VOICE" : "ONLINE"}</span></div>
        <div className="messages">
          {messages.map((message, index) => <div key={index} className={`message ${message.role}`}>
            <div className="message-avatar">{message.role === "assistant" ? "J" : "DU"}</div>
            <div><small>{message.role === "assistant" ? "J.A.R.V.I.S." : "BENUTZER"}</small><p>{message.content}</p></div>
          </div>)}
          {busy && <div className="typing"><span/><span/><span/> J.A.R.V.I.S. analysiert…</div>}
          <div ref={bottom}/>
        </div>
        <form className="composer" onSubmit={submit}>
          <button type="button" className={`mic ${listening ? "active" : ""}`} onClick={toggleListening} aria-label="Spracheingabe">{listening ? <MicOff/> : <Mic/>}</button>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Sagen oder schreiben Sie etwas…" />
          <button type="button" className="sound" onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) window.speechSynthesis?.cancel(); }} aria-label="Sprachausgabe umschalten">{voiceEnabled ? <Volume2/> : <VolumeX/>}</button>
          <button className="send" type="submit" disabled={busy || !input.trim()} aria-label="Senden"><Send size={17}/></button>
        </form>
        <div className="composer-hint">Live-Sprachdialog über WebRTC. Mikrofonfreigabe und HTTPS/localhost erforderlich. Taste erneut drücken, um die Verbindung zu beenden.</div>
      </section>
    </section>
    <footer>J.A.R.V.I.S. STARTER BUILD <span>BLACK / GOLD INTERFACE</span><span>PRIVATE DEPLOYMENT READY</span></footer>
  </div>;
}
