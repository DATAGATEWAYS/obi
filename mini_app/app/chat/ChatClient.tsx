"use client";
import {useEffect, useRef, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";

type Msg = { role: "user" | "assistant" | "system"; text: string; typing?: boolean; html?: boolean; };

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
    const {user, ready, authenticated} = usePrivy();
    const [typingStep, setTypingStep] = useState(0);
    type ChatDTO = { id: number; name: string };

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chats, setChats] = useState<ChatDTO[]>([]);

    const [msgs, setMsgs] = useState<Msg[]>([
        {role: "assistant", text: "Hey, what would you like to learn today?"},
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const [chatId, setChatId] = useState<number | null>(null);

    useEffect(() => {
        const hasTyping = msgs.some(m => m.typing);
        if (!hasTyping) {
            setTypingStep(0);
            return;
        }
        const id = setInterval(() => setTypingStep(s => (s + 1) % 4), 400);
        return () => clearInterval(id);
    }, [msgs]);

    // autoscroll
    useEffect(() => {
        listRef.current?.scrollTo({top: listRef.current.scrollHeight, behavior: "smooth"});
    }, [msgs.length]);

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

        setMsgs(m => [...m, {role: "user", text: q}]);
        setInput("");
        setSending(true);

        setMsgs(m => [...m, {role: "assistant", text: "typing", typing: true}]);

        try {
            const tgId = getTgId();
            if (!tgId) {
                setMsgs(m => {
                    const n = [...m];
                    const i = n.findIndex(mm => mm.typing);
                    const msg = {
                        role: "system",
                        text:
                            "I couldn’t detect your Telegram ID. Please open the mini app from the bot or log in with Telegram.",
                    } as Msg;
                    if (i >= 0) n[i] = msg; else n.push(msg);
                    return n;
                });
                return;
            }

            const r = await fetch("/api/chat/ask", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({telegram_id: tgId, question: q, chat_id: chatId}),
            });

            let data: any;
            const ct = r.headers.get("content-type") || "";
            data = ct.includes("application/json") ? await r.json() : await r.text();

            let raw =
                typeof data === "string"
                    ? data
                    : data?.answer ?? data?.text ?? data?.message ?? "";

            if (!raw) raw = "Sorry, I couldn't generate a response.";

            const html = raw.replace(/\n/g, "<br/>");

            setMsgs(m => {
                const n = [...m];
                const i = n.findIndex(mm => mm.typing);
                const msg: Msg = {role: "assistant", text: html, html: true};
                if (i >= 0) n[i] = msg; else n.push(msg);
                return n;
            });
        } catch (e: any) {
            setMsgs(m => {
                const n = [...m];
                const i = n.findIndex(mm => mm.typing);
                const msg: Msg = {
                    role: "system",
                    text: `Request failed: ${String(e?.message || e)}`,
                };
                if (i >= 0) n[i] = msg; else n.push(msg);
                return n;
            });
        } finally {
            setSending(false);
        }
    }

    useEffect(() => {
        const tgId = getTgId();
        if (!tgId) return;
        (async () => {
            const r = await fetch("/api/chat/create", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({telegram_id: tgId, name: "General"}),
            });
            const j = await r.json();
            if (r.ok && j?.id) {
                setChatId(Number(j.id));
                refreshChats();
            }
        })();
    }, [ready]);

    async function refreshChats() {
        const tgId = getTgId();
        if (!tgId) return;
        const r = await fetch(`/api/chat/list?telegram_id=${tgId}`, {cache: "no-store"});
        if (!r.ok) return;
        const items: ChatDTO[] = await r.json();
        setChats(items);
    }

    useEffect(() => {
        refreshChats();
    }, [chatId]);

    return (
        <main style={{display: "grid", gridTemplateRows: "auto 1fr auto", height: "100dvh", background: "#EEE8C9"}}>
            {/* header */}
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px"}}>
                <button
                    onClick={() => setSidebarOpen(o => !o)}
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
                            boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                        }}>
                            {m.typing ? (
                                <span>typing{'.'.repeat(typingStep)}</span>
                            ) : m.html ? (
                                <div dangerouslySetInnerHTML={{__html: m.text}}/>
                            ) : (
                                m.text
                            )}
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
                onSubmit={(e) => {
                    e.preventDefault();
                    send();
                }}
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
            {/* LEFT DRAWER */}
            <div
                onClick={() => setSidebarOpen(false)}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: sidebarOpen ? "rgba(0,0,0,.15)" : "transparent",
                    pointerEvents: sidebarOpen ? "auto" : "none",
                    transition: "background .2s ease",
                    zIndex: 50,
                }}
            >
                <aside
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        left: 0, top: 0, bottom: 0,
                        width: 280,
                        background: "#fff",
                        boxShadow: "2px 0 12px rgba(0,0,0,.08)",
                        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                        transition: "transform .2s ease",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div style={{padding: 12, borderBottom: "1px solid #eee", fontWeight: 700, color: "#6d7d4f"}}>
                        Your chats
                    </div>

                    <div style={{padding: 8, display: "grid", gap: 6, overflowY: "auto"}}>
                        {chats.map(c => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setChatId(c.id);
                                    setSidebarOpen(false);
                                }}
                                style={{
                                    textAlign: "left",
                                    background: chatId === c.id ? "#EAF0D8" : "#F7F7F7",
                                    color: "#556045",
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    cursor: "pointer",
                                }}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>

                    <div style={{marginTop: "auto", padding: 12, borderTop: "1px solid #eee"}}>
                        <button
                            onClick={async () => {
                                const tgId = getTgId();
                                if (!tgId) return;
                                const name = prompt("New chat name");
                                if (!name) return;
                                const r = await fetch("/api/chat/create", {
                                    method: "POST",
                                    headers: {"Content-Type": "application/json"},
                                    body: JSON.stringify({telegram_id: tgId, name}),
                                });
                                const j = await r.json();
                                if (r.ok && j?.id) {
                                    setChatId(Number(j.id));
                                    await refreshChats();
                                    setSidebarOpen(false);
                                }
                            }}
                            style={{background: "#6b8749", color: "#fff", width: "100%"}}
                        >
                            + Add chat
                        </button>
                    </div>
                </aside>
            </div>
        </main>
    );
}