"use client";
import {useEffect, useRef, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";

type Msg = { role: "user" | "assistant" | "system"; text: string };

const SUGGESTIONS = [
  "What's a wallet?",
  "How do I create a wallet?",
  "What's a scam to avoid?",
  "What is Polygon?",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Ask Obi anything";
  if (h < 18) return "Ask Obi anything";
  return "Ask Obi anything";
}

export default function ChatClient() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "Hey, what would you like to learn today?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // автоскролл
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  // извлекаем Telegram user id (через Privy, а если вдруг нет — из Telegram WebApp)
  function getTgId(): number | null {
    const p: any = user as any;
    const fromPrivy =
      p?.telegram?.telegramUserId ??
      p?.telegram?.id ??
      null;

    if (fromPrivy) return Number(fromPrivy) || null;

    const w = globalThis as any;
    const fromInitData = w?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    return fromInitData ? Number(fromInitData) : null;
  }

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || sending) return;

    // покажем сообщение пользователя сразу
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setSending(true);

    try {
      const tgId = getTgId();
      if (!tgId) {
        // если нет id — вернём пользователя назад / попросим открыть через Telegram
        setMsgs((m) => [
          ...m,
          {
            role: "system",
            text:
              "I couldn’t detect your Telegram ID. Please open the mini app from the bot or log in with Telegram.",
          },
        ]);
        return;
      }

      const r = await fetch("/api/chat/ask", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ user_id: tgId, question: q }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const answer = j?.answer ?? "Sorry, I couldn't generate a response.";
      setMsgs((m) => [...m, { role: "assistant", text: answer }]);
    } catch (e: any) {
      setMsgs((m) => [
        ...m,
        { role: "system", text: `Request failed: ${String(e?.message || e)}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={{display: "grid", gridTemplateRows: "auto 1fr auto", height: "100dvh", background: "#EEE8C9"}}>
      {/* header */}
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px"}}>
        <button
          onClick={() => router.push("/dashboard")}
          aria-label="Back"
          style={{background: "none", border: 0, fontSize: 18, cursor: "pointer"}}
        >
          ⟲
        </button>
        <div style={{fontWeight: 700, color: "#6d7d4f"}}>{getGreeting()}</div>
        <button
          onClick={() => router.push("/dashboard")}
          aria-label="Close"
          style={{background: "none", border: 0, fontSize: 18, cursor: "pointer"}}
        >
          ✕
        </button>
      </div>

      {/* messages */}
      <div ref={listRef} style={{overflowY: "auto", padding: "8px 12px"}}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            margin: "8px 0"
          }}>
            <div style={{
              maxWidth: "80%",
              padding: "10px 12px",
              borderRadius: 14,
              whiteSpace: "pre-wrap",
              background: m.role === "user" ? "#d9e7cf" : "#fff",
              color: "#2b2b2b",
              boxShadow: "0 1px 3px rgba(0,0,0,.06)"
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* quick suggestions */}
      <div style={{display: "flex", gap: 8, flexWrap: "wrap", padding: "0 12px 8px"}}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={sending}
            style={{
              border: 0,
              padding: "8px 10px",
              borderRadius: 18,
              background: "#EAF0D8",
              color: "#556045",
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        style={{display: "flex", gap: 8, padding: 12}}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about crypto..."
          disabled={sending}
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 18,
            border: "1px solid #ddd",
            outline: "none",
            background: "#fff",
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            padding: "10px 16px",
            borderRadius: 18,
            border: 0,
            background: "#6b8749",
            color: "#fff",
            cursor: "pointer",
            minWidth: 64
          }}
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </main>
  );
}